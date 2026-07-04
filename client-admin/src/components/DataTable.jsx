// Minimal reusable table. `columns` is [{ key, header, render?, className? }].
// `rowKey` picks a stable key. `actions` renders a trailing actions cell.

export default function DataTable({
  columns,
  rows,
  rowKey = (r) => r._id,
  actions,
  loading = false,
  empty = 'No records yet.',
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 text-left font-medium text-slate-500 ${c.className || ''}`}
              >
                {c.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-10 text-center text-slate-400">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-10 text-center text-slate-400">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-slate-700 ${c.className || ''}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
