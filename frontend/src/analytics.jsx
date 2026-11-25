import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money, useData } from './api'
import { Select, State } from './components/shared'

export default function Analytics() {
  const [condition, setCondition] = useState('')
  const summary = useData('/analytics/historical' + (condition ? '?' + new URLSearchParams({ condition }) : ''))
  const data = summary.data
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor']
  return <section className="shell page">
    <div className="page-heading"><h1>Resale analytics</h1><p>Compare original and sold prices in the historical dataset.</p></div>
    <div className="analytics-controls">
      <label>Condition<Select value={condition} onChange={event => setCondition(event.target.value)}>
        <option value="">All conditions</option>
        {conditions.map(value => <option key={value}>{value}</option>)}
      </Select></label>
      {data && <p role="status">{data.count} historical {data.count === 1 ? 'record' : 'records'}</p>}
    </div>
    <State query={{ ...summary, data: data?.groups }} empty="No historical sales match this filter." />
    {data?.groups.length > 0 && <>
      <div className="panel analytics-panel">
        <h2>Average prices by category</h2>
        <div className="analytics-chart" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.groups} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="#e0e9dd" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis tickFormatter={value => '₹' + (value >= 1000 ? value / 1000 + 'k' : value)} tick={{ fontSize: 12 }} width={50} />
              <Tooltip formatter={value => money(value)} />
              <Legend />
              <Bar dataKey="averageOriginal" name="Original price" fill="#a7c7ad" radius={[5, 5, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="averageSold" name="Sold price" fill="#166534" radius={[5, 5, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel analytics-panel">
        <div className="analytics-table" tabIndex={0} role="region" aria-label="Category statistics">
          <table>
            <caption>Category statistics</caption>
            <thead><tr><th scope="col">Category</th><th scope="col">Records</th><th scope="col">Avg. original</th><th scope="col">Avg. sold</th><th scope="col">Avg. value retained</th></tr></thead>
            <tbody>{data.groups.map(group => <tr key={group.name}>
              <th scope="row">{group.name}</th><td>{group.count}</td><td>{money(group.averageOriginal)}</td><td>{money(group.averageSold)}</td><td>{group.retainedPercent}%</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p>Value retained is the average of each item’s sold price divided by its original price.</p>
      </div>
    </>}
    <p className="analytics-source">Source: the supplied historical workbook. It covers books, calculators and bicycles.</p>
  </section>
}
