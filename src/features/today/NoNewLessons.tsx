import {Link} from 'react-router-dom'
import {useWork} from '../../ui/context'
export function NoNewLessons(){const {cat,data}=useWork()
 const next=cat.projects.flatMap(p=>p.milestones.filter(m=>!m.checks.every((_,i)=>data.projects.find(r=>r.projectId===p.id)?.done.includes(m.id+':'+i))).map(m=>({title:m.title,key:p.id+':'+m.id})))[0]
 return <section className="waiting-lessons"><b>下一批課程還在準備中</b><p>這條路線暫時沒有可排的新課，今天也能練一點別的。</p><div className="actions"><Link to="/session?ahead=1&scope=due&format=flashcard">提前複習</Link><Link to={next?'/projects?milestone='+encodeURIComponent(next.key):'/projects'}>{next?'作品里程碑：'+next.title:'查看作品集'}</Link><Link to="/bank">到題庫練一題</Link></div></section>
}