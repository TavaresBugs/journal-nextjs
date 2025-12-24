export function MentorTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <th className="px-6 py-4 text-left font-medium text-gray-400">Mentorado</th>
            <th className="w-32 px-4 py-4 text-center font-medium text-gray-400">Status</th>
            <th className="w-32 px-4 py-4 text-center font-medium text-gray-400">Permissão</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Total Trades</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Win Rate</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Esta Semana</th>
            <th className="w-32 px-4 py-4 text-center font-medium text-gray-400">Ações</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse border-b border-gray-800">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gray-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-800" />
                    <div className="h-3 w-40 rounded bg-gray-800/50" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div className="mx-auto h-6 w-24 rounded bg-gray-800" />
              </td>
              <td className="px-4 py-4 text-center">
                <div className="mx-auto h-6 w-24 rounded bg-gray-800" />
              </td>
              <td className="px-4 py-4 text-center">
                <div className="mx-auto h-4 w-12 rounded bg-gray-800/50" />
              </td>
              <td className="px-4 py-4 text-center">
                <div className="mx-auto h-4 w-12 rounded bg-gray-800/50" />
              </td>
              <td className="px-4 py-4 text-center">
                <div className="mx-auto h-4 w-12 rounded bg-gray-800/50" />
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-8 w-8 rounded bg-gray-800" />
                  <div className="h-8 w-8 rounded bg-gray-800" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
