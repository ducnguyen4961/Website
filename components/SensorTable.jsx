import React from "react";

const SensorTable = ({ data }) => {
  if (!data || data.length === 0) return <div>Không có dữ liệu.</div>;

  const headers = Object.keys(data[0]);

  return (
    <table className="table-auto border w-full text-sm">
      <thead>
        <tr>
          {headers.map(header => (
            <th key={header} className="border p-2">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {headers.map(header => (
              <td key={header} className="border p-2 text-center">
                {row[header] ?? "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SensorTable;
