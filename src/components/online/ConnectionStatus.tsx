/**
 * ConnectionStatus - Visual indicator for connection state
 */

import type { ConnectionStatus as ConnectionStatusType } from "../../types";

interface ConnectionStatusProps {
	status: ConnectionStatusType;
	className?: string;
}

export const ConnectionStatus = ({
	status,
	className = "",
}: ConnectionStatusProps) => {
	const getStatusConfig = () => {
		switch (status) {
			case "connected":
				return {
					color: "bg-green-500",
					text: "Connected",
					animate: false,
				};
			case "connecting":
				return {
					color: "bg-yellow-500",
					text: "Connecting...",
					animate: true,
				};
			case "reconnecting":
				return {
					color: "bg-orange-500",
					text: "Reconnecting...",
					animate: true,
				};
			default:
				return {
					color: "bg-gray-400",
					text: "Disconnected",
					animate: false,
				};
		}
	};

	const config = getStatusConfig();

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<div className="relative">
				<div
					className={`w-3 h-3 rounded-full ${config.color} ${
						config.animate ? "animate-pulse" : ""
					}`}
				/>
				{config.animate && (
					<div
						className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} animate-ping opacity-75`}
					/>
				)}
			</div>
			<span className="text-sm text-gray-600">{config.text}</span>
		</div>
	);
};
