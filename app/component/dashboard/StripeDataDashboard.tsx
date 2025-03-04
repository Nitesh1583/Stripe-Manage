
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function StripeDataDashboard({data}) {
  console.log(data);
  return (
        <div>
          <h2>Financial Metrics</h2>
          <LineChart width={800} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            <Line type="monotone" dataKey="refunds" stroke="#82ca9d" />
            {/* Add more lines for other metrics */}
          </LineChart>
        </div>
  );
}

export default StripeDataDashboard;