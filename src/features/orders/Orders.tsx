import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderList } from './OrderList';
import { status, visible, type Props } from '../../app/shared';
import { Icon } from '../../app/ui';
export function Orders({ data }: Props) {
 const [q,setQ]=useState(''); const [filter,setFilter]=useState('all');
 const orders=data.orders.filter(o=>(filter==='Archived'?!visible(o):visible(o) && (filter==='all'||status(o)===filter)) && `${data.customers.find(c=>c.id===o.customerId)?.name} ${data.customers.find(c=>c.id===o.customerId)?.phone} ${o.id}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 return <><div className="heading"><div><span className="eyebrow">FROM CUTTING TABLE TO COLLECTION</span><h1>The order book.</h1><p>A clear view of every fitting and every promised date.</p></div><Link className="primary" to="/new"><Icon name="plus"/>New order</Link></div><div className="toolbar"><label>Search orders<input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Name, phone or order ID"/></label><label>Order status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All active orders</option><option>On schedule</option><option>Overdue</option><option>Delivered</option><option>Archived</option></select></label></div><section className="card"><div className="section-heading"><h2>{filter==='Archived'?'The archive':'Your orders'}</h2><span className="badge">{orders.length} records</span></div><OrderList orders={orders} data={data}/></section></>;
}
