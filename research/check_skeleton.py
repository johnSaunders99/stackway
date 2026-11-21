"""Check the v2 curriculum, mastery references and original market evidence offline."""
import csv
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

import yaml

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
RESEARCH = ROOT / "research"
DAY = "2026-11-20"


def check(ok, message):
    if not ok:
        raise ValueError(message)


class UniqueKeys(yaml.SafeLoader):
    pass


def mapping(loader, node):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=True)
        check(key not in result, f"duplicate YAML key {key}")
        result[key] = loader.construct_object(value_node, deep=True)
    return result


UniqueKeys.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)


def parse(source, name):
    try:
        return yaml.load(source, Loader=UniqueKeys)
    except Exception as error:
        raise ValueError(f"{name}: {error}") from error


def read(path):
    return parse(path.read_text(encoding="utf-8-sig"), path)


def fields(obj, keys, label):
    check(isinstance(obj, dict), f"{label}: expected mapping")
    for key in keys.split():
        check(key in obj and obj[key] is not None and obj[key] != "", f"{label}: missing {key}")


def seq(values, low=0, high=None):
    return isinstance(values, list) and len(values) >= low and (high is None or len(values) <= high)


def map_labels(obj):
    for key, limit in (("title", 18), ("subtitle", 26)):
        value = obj.get(key)
        check(isinstance(value, str) and value == value.strip() and 1 <= len(value) <= limit,
              f"{obj['id']}: {key} must be 1..{limit} characters")


def refs(values, index, label):
    check(seq(values) and len(set(values)) == len(values), f"{label}: invalid reference list")
    for value in values:
        check(value in index, f"{label}: unknown reference {value}")


def graphcheck(graph):
    done, stack = set(), []
    def visit(node):
        if node in done:
            return
        check(node not in stack, f"cycle: {' -> '.join(stack + [node])}")
        stack.append(node)
        for parent in graph[node]:
            visit(parent)
        stack.pop()
        done.add(node)
    for key in graph:
        visit(key)


seen = set()
def ident(value, label):
    check(isinstance(value, str) and re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", value), f"{label}: bad ID {value}")
    check(value not in seen, f"{label}: duplicate ID {value}")
    seen.add(value)


def rows(name):
    with (RESEARCH / name).open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


tracks_raw = read(CONTENT / "tracks.yaml")
tracks = {t["id"]: t for t in tracks_raw}
check(len(tracks_raw) == 4 and set(tracks) == {"foundations", "fullstack", "aiinfra", "career"}, "track set")
for track in tracks_raw:
    fields(track, "id title short color summary", track["id"])
    check(track["color"] in {"wood", "teal", "violet", "vermilion", "slate"}, track["id"])

roles_raw = read(CONTENT / "roles.yaml")
roles = {r["id"]: r for r in roles_raw}
check(len(roles_raw) == 2 and set(roles) == {"fullstack", "aiinfra"}, "role set")
modules, lessons, projects, banks = {}, {}, {}, {}
order_by_track = defaultdict(set)
for f in sorted((CONTENT / "modules").glob("*/module.yaml")):
    m = read(f)
    fields(m, "id track stage order title summary outcomes prereqs roles hours", f)
    mid = m["id"]
    map_labels(m)
    ident(mid, f)
    check(mid == f.parent.name and m["track"] in tracks, mid)
    prefix = {"foundations": "fd-", "fullstack": "fs-", "aiinfra": "ai-", "career": "cr-"}[m["track"]]
    check(mid.startswith(prefix) and m["stage"] in range(5) and m["hours"] > 0, mid)
    check(m["order"] not in order_by_track[m["track"]] and m["order"] % 10 == 0, mid)
    order_by_track[m["track"]].add(m["order"])
    check(len(m["summary"]) <= 60 and seq(m["outcomes"], 3, 6), mid)
    refs(m["roles"], roles, mid)
    modules[mid] = m
path = read(CONTENT / "path.yaml")["recommended"]
refs(path, modules, "path")
check(set(path) == set(modules), "path must cover all modules")
for mid, m in modules.items():
    refs(m["prereqs"], modules, mid)
    check(all(path.index(p) < path.index(mid) for p in m["prereqs"]), f"non-topological path: {mid}")
graphcheck({m: v["prereqs"] for m, v in modules.items()})

ledger_raw = rows("resource-checks.csv")
ledger = {r["url"]: r for r in ledger_raw}
check(len(ledger_raw) == len(ledger), "duplicate resource evidence")
check(all(r["http_status"] == "200" and r["access"] for r in ledger_raw), "resource HTTP evidence")
used = Counter()
by_module = defaultdict(list)
stages, by_track = Counter(), Counter()
pilot = path[0]
concepts = tasks = interviews = 0
for f in sorted((CONTENT / "modules").glob("*/*.md")):
    text = f.read_text(encoding="utf-8-sig")
    match = re.fullmatch(r"---\n(.*?)\n---(?:\n(.*))?", text, re.S)
    check(match, f"frontmatter: {f}")
    obj, body = parse(match[1], f), match[2] or ""
    fields(obj, "id module order title status minutes level objectives tags resources", f)
    lid, mid = obj["id"], obj["module"]
    map_labels(obj)
    ident(lid, f)
    check(mid == f.parent.name and mid in modules and lid.startswith(mid + "-"), lid)
    # The number in an existing lesson ID is permanent; file order can change.
    slug = re.fullmatch(re.escape(mid) + r"-\d{2}-([a-z0-9]+(?:-[a-z0-9]+)*)", lid)
    check(slug and f.name == f"{obj['order']:02d}-{slug[1]}.md", lid)
    check(0 < obj["order"] == int(f.name[:2]) and 20 <= obj["minutes"] <= 40 and obj["level"] in range(1, 5), lid)
    check(seq(obj["objectives"], 2, 5) and seq(obj["tags"], 1), lid)
    check(seq(obj["resources"], 1, 3 if obj["status"] == "stub" else 4), f"resource count: {lid}")
    check(len({r["url"] for r in obj["resources"]}) == len(obj["resources"]), f"duplicate lesson URL: {lid}")
    check("%LOCALAPPDATA%" not in text.upper(), f"obsolete workspace: {lid}")
    for r in obj["resources"]:
        fields(r, "title url kind lang minutes required checked", lid)
        u = urlsplit(r["url"])
        check(u.scheme in ("https", "http") and u.hostname and not u.username and not u.password, lid)
        check(r["kind"] in "doc video course book article paper repo interactive tool".split(), lid)
        check(r["lang"] in ("en", "zh-Hant", "zh-Hans", "other") and type(r["required"]) is bool and r["minutes"] > 0, lid)
        check(r["url"] in ledger and str(r["checked"]) == ledger[r["url"]]["checked"] == DAY, lid)
        check(r["title"] == ledger[r["url"]]["resource_title"] and r["lang"] == ledger[r["url"]]["lang"], lid)
        check(len(r.get("note", "")) <= 40, lid)
        used[r["url"]] += 1
    check(obj["status"] == ("ready" if mid == pilot else "stub"), lid)
    if obj["status"] == "stub":
        check(not body.strip() and not obj.get("concepts") and not obj.get("practice"), f"stub scope: {lid}")
    if obj["status"] == "ready":
        check(seq(obj.get("concepts"), 3, 6) and seq(obj.get("practice"), 1, 1), lid)
        check(800 <= len(re.findall(r"[\u3400-\u9fff]", re.sub(r"\x60{3}.*?\x60{3}", "", body, flags=re.S))) <= 1800, f"body length: {lid}")
        check(all(drive + r":\dev\stackway-lab" in body for drive in "CD"), f"pilot workspace: {lid}")
        heads = re.findall(r"^(#+) (.+)", body, re.M)
        check(all(len(h) in (2, 3) for h, _ in heads), lid)
        check([h.split("：")[0] for depth, h in heads if depth == "##"] == ["為什麼要學", "核心概念", "範例", "常見錯誤", "小結"], lid)
        fences = re.findall(r"^\x60{3}(.*)$", body, re.M)
        check(len(fences) >= 2 and len(fences) % 2 == 0 and all(re.fullmatch(r"[\w+-]+", x) for x in fences[::2]) and not any(fences[1::2]), lid)
        local_mcq = 0
        for concept in obj["concepts"]:
            fields(concept, "id prompt answer", lid)
            ident(concept["id"], lid)
            concepts += 1
            if "mcq" in concept:
                q = concept["mcq"]
                fields(q, "options answer explain", lid)
                check(seq(q["options"], 4, 4) and len(q["options"]) == len(set(q["options"])), lid)
                check(type(q["answer"]) is int and 0 <= q["answer"] < len(q["options"]), lid)
                local_mcq += 1
            if "interview" in concept:
                q = concept["interview"]
                fields(q, "question points answer", lid)
                check(seq(q["points"], 2, 6) and len(q["answer"]) <= 200, lid)
                interviews += 1
        check(local_mcq > len(obj["concepts"]) / 2, lid)
        check(obj["level"] < 2 or any("interview" in c for c in obj["concepts"]), lid)
        for task in obj["practice"]:
            fields(task, "id title kind minutes steps checks", lid)
            ident(task["id"], lid)
            check(0 < task["minutes"] <= obj["minutes"] and seq(task["steps"], 1) and seq(task["checks"], 1), lid)
            check(task["kind"] in {"hands-on", "code", "build", "explain", "read"}, lid)
            tasks += 1
    by_module[mid].append(lid)
    lessons[lid] = obj
    stages[modules[mid]["stage"]] += 1
    by_track[modules[mid]["track"]] += 1
check(set(used) == set(ledger), "unused resource evidence")
for mid in modules:
    orders = sorted(lessons[l]["order"] for l in by_module[mid])
    check(3 <= len(orders) <= 14 and orders == list(range(1, len(orders)+1)), mid)
    minutes = sum(lessons[l]["minutes"] for l in by_module[mid])
    check(modules[mid]["hours"] == ((minutes + 5) // 6) / 10, f"module hour rollup: {mid}")
    sequence = sorted(by_module[mid], key=lambda l: lessons[l]["order"])
    for i, lid in enumerate(sequence):
        check(lessons[lid].get("prereqs", []) == sequence[max(0, i-1):i], f"lesson sequence: {lid}")
lesson_graph = {}
for lid, obj in lessons.items():
    req = obj.get("prereqs", [])
    refs(req, lessons, lid)
    # A module prerequisite means every lesson in that module must be done.
    lesson_graph[lid] = req + [l for m in modules[obj["module"]]["prereqs"] for l in by_module[m]]
graphcheck(lesson_graph)
for f in sorted((CONTENT / "projects").glob("*.yaml")):
    p = read(f)
    fields(p, "id track title summary why modules level hours milestones showcase", f)
    ident(p["id"], f)
    check(p["id"] == f.stem and p["track"] in tracks and p["hours"] > 0 and p["level"] in range(1, 5), f)
    check(len(p["why"]) <= 80 and len(p["showcase"]) <= 120 and seq(p["milestones"], 1) and seq(p["modules"], 1), f)
    refs(p["modules"], modules, f)
    for item in p["milestones"]:
        fields(item, "id title checks", f)
        ident(item["id"], f)
        check(seq(item["checks"], 1), f)
    projects[p["id"]] = p
for mid, m in modules.items():
    check("project" not in m or m["project"] in projects, mid)
bank_questions = 0
for f in sorted((CONTENT / "interview").glob("*.yaml")):
    bank = read(f)
    fields(bank, "id title track questions", f)
    ident(bank["id"], f)
    check(bank["id"] == f.stem and bank["track"] in tracks and seq(bank["questions"], 8), f)
    for q in bank["questions"]:
        fields(q, "id question points answer tags", f)
        ident(q["id"], f)
        check(seq(q["points"], 2, 6) and len(q["answer"]) <= 200 and seq(q["tags"], 1), f)
        bank_questions += 1
    banks[bank["id"]] = bank
check({"iv-behavioral", "iv-fs-system-design", "iv-ml-system-design", "iv-infra-troubleshooting"} <= set(banks), "missing interview bank")
jobs = rows("jobs.csv")
check(jobs and list(jobs[0]) == "role_family title company market level url date_seen skills".split(), "CSV header")
evidence_rows = rows("job-evidence.csv")
evidence = {v["url"]: v for v in evidence_rows}
check(len(evidence_rows) == len(evidence) == len(jobs) and len({j["url"] for j in jobs}) == len(jobs), "job duplicates")
freq = defaultdict(Counter)
job_counts = Counter()
for j in jobs:
    check(all(j.values()) and j["role_family"] in roles and j["date_seen"] == DAY, "job row")
    e = evidence[j["url"]]
    u = urlsplit(j["url"])
    check(u.scheme == "https" and u.hostname and not re.search(r"\s", j["url"]), "malformed job URL")
    check(e["direct_http_status"] in {"200", "403", "429"} and e["public_research_browser"] == "role description read", j["url"])
    skills = j["skills"].split(";")
    core, plus = [set(filter(None, e[k].split(";"))) for k in ("core_or_duty", "preferred_only")]
    check(not core & plus and set(skills) == core | plus and len(skills) == len(set(skills)), j["url"])
    check(bool(e["window_evidence"]) and date.fromisoformat(j["date_seen"]) <= date(2026, 11, 30), j["url"])
    freq[j["role_family"]].update(skills)
    job_counts[j["role_family"]] += 1
for rid, r in roles.items():
    fields(r, "id title summary skills", rid)
    check(seq(r["skills"], 1) and job_counts[rid] >= 30, rid)
    for s in r["skills"]:
        fields(s, "id title weight modules", rid)
        ident(s["id"], rid)
        refs(s["modules"], modules, s["id"])
        tag = s["id"].split("-", 2)[2]
        hits, total = freq[rid][tag], job_counts[rid]
        check(seq(s["modules"], 1) and hits > 0 and s["weight"] == (3 if 2*hits > total else 2 if 5*hits >= total else 1), s["id"])
check(330 <= len(lessons) <= 420 and 6 <= len(projects) <= 10, "brief size")
check(pilot == "fd-computer" and len(by_module[pilot]) == 4, "four-lesson pilot")
expected_yaml = {CONTENT / f"{n}.yaml" for n in ("roles", "tracks", "path")}
expected_yaml.update(CONTENT / "modules" / m / "module.yaml" for m in modules)
expected_yaml.update(CONTENT / "projects" / (p + ".yaml") for p in projects)
expected_yaml.update(CONTENT / "interview" / (b + ".yaml") for b in banks)
check(set(CONTENT.rglob("*.yaml")) == expected_yaml and not list(CONTENT.rglob("*.yml")), "unparsed YAML")
check(sum(1 for _ in CONTENT.rglob("*.md")) == len(lessons), "unparsed Markdown")
minutes = sum(l["minutes"] for l in lessons.values())
print(f"PASS tracks={len(tracks)} roles={len(roles)} modules={len(modules)} lessons={len(lessons)} minutes={minutes}")
print("TRACK_LESSONS", " ".join(f"{t}:{by_track[t]}" for t in tracks))
print("STAGE_LESSONS", " ".join(f"{s}:{stages[s]}" for s in sorted(stages)))
print(f"PILOT {pilot}: ready={len(by_module[pilot])} concepts={concepts} practice={tasks} interview={interviews}")
print(f"PROJECTS={len(projects)} BANKS={len(banks)} BANK_QUESTIONS={bank_questions} TOTAL_INTERVIEW={bank_questions+interviews}")
print(f"RESOURCES placements={sum(used.values())} distinct={len(used)} opened_and_HTTP_200={len(ledger)}")
print("JOBS", " ".join(f"{r}:{job_counts[r]}" for r in roles), "markets="+str(len({j["market"] for j in jobs})))
print("PASS IDs, references, both prerequisite graphs, topological path, schemas, pilot, resource ledger and market weights")
