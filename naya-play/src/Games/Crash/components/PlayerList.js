import { formatNumber } from "../utils/gameUtils";
export const PlayersList = ({ players }) => (
    <div className="absolute left-4 top-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 w-72">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Active Players</h3>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
      
          <span>{players.length}</span>
        </div>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between text-sm bg-gray-800/50 p-2 rounded">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                flex items-center justify-center text-xs text-white">
                {player.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 font-medium">{player.username}</span>
            </div>
            <div className="text-right">
              <div className="text-gray-300">${formatNumber(player.betAmount)}</div>
              {player.cashoutMultiplier && (
                <div className="text-green-400 text-xs">
                  Cashed @ {formatNumber(player.cashoutMultiplier)}x
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );