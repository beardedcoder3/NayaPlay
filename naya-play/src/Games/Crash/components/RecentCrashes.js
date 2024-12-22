import { formatNumber } from "../utils/gameUtils";

export const RecentCrashes = ({ crashes }) => (
    <div className="absolute right-4 top-24 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Crashes</h3>
      <div className="flex gap-2">
        {crashes.map((crash) => (
          <div
            key={crash.id}
            className={`px-3 py-1 rounded font-medium text-sm ${
              crash.multiplier < 2 ? 'bg-red-500/20 text-red-400' :
              crash.multiplier < 4 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}
          >
            {formatNumber(crash.multiplier)}x
          </div>
        ))}
      </div>
    </div>
  );