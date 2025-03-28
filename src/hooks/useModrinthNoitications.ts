import type { NotificationCenterItem } from "react-toastify/addons/use-notification-center";
import { useQuery } from "@tanstack/react-query";
import type { Id } from "react-toastify";
import { useCallback } from "react";

import { getProjects, getVersions } from "@/lib/api/modrinth/sdk.gen";
import type { ToastData } from "@/components/ui/toast";
import { queryClient } from "@/lib/api/queryClient";
import { useModrinth } from "./useModrinth";

const NOTIFICATION_KEY = "MODRINTH_NOTIFICATIONS";
export const useModrinthNotifications = () => {
	const modrinth = useModrinth();
	const modrinthUser = modrinth.getActiveAccount();
	const { data } = useQuery({
		enabled: !!modrinthUser?.id,
		queryKey: [NOTIFICATION_KEY, modrinthUser?.id],
		queryFn: async () => {
			const notifications = await modrinth.getNotifications();

			const projectIds = Array.from(
				new Set(
					notifications
						.map((e) => {
							const items = e.link.split("/");
							if (items.at(1) === "project") {
								return items.at(2);
							}
							return null;
						})
						.filter(Boolean),
				),
			)
				.map((e) => `"${e}"`)
				.join(",");
			const { error, data, response } = await getProjects({
				query: {
					ids: `[${projectIds}]`,
				},
			});

			if (error) throw error;
			if (!data || !response.ok)
				throw new Error("Failed to load projects", { cause: response });

			const versionIds = Array.from(
				new Set(
					notifications
						.map((e) => {
							const items = e.link.split("/");
							if (items.at(3) === "version") {
								return items.at(4);
							}
							return null;
						})
						.filter(Boolean),
				),
			)
				.map((e) => `"${e}"`)
				.join(",");

			const {
				data: versionsData,
				error: versionsError,
				response: versionsResponse,
			} = await getVersions({
				query: {
					ids: `[${versionIds}]`,
				},
			});
			if (versionsError) throw versionsError;
			if (!versionsData || !versionsResponse.ok)
				throw new Error("Failed to load projects versions", {
					cause: versionsResponse,
				});

			const info: NotificationCenterItem<ToastData>[] = [];

			for (const notification of notifications) {
				const links = notification.link.split("/");

				if (links.at(1) === "project" && links.at(3) === "version") {
					const projectId = links.at(2);
					const versionId = links.at(4);

					const project = data.find((e) => e.id === projectId);
					if (projectId && project) {
						notification.text = notification.text.replaceAll(
							projectId,
							project.title ?? "Unknown Project",
						);
					}

					const version = versionsData.find((e) => e.id === versionId);
					if (versionId && version) {
						notification.text = notification.text.replaceAll(
							versionId,
							version.name ?? "Unknown Version",
						);
					}
				}

				info.push({
					read: notification.read,
					createdAt: new Date(notification.created).getTime(),
					id: notification.id,
					data: {
						title: notification.title,
						description: notification.text,
					}
				});
			}

			return {
				notifcations: info,
				read: notifications.filter((e) => !e.read).length,
			};
		},
	});

	const markAllAsRead = useCallback(() => {
		if (!modrinthUser) return;
		const n = data?.notifcations;
		if (!n) return;

		modrinth
			.readNotifications(n.map((e) => e.id as string))
			.then(() =>
				queryClient.invalidateQueries({ queryKey: [NOTIFICATION_KEY] }),
			);
	}, [modrinthUser, data?.notifcations, modrinth.readNotifications]);

	const clear = useCallback(() => {
		if (!modrinthUser) return;
		const n = data?.notifcations;
		if (!n?.length) return;
		modrinth
			.deleteNotifications(n.map((e) => e.id as string))
			.then(() =>
				queryClient.invalidateQueries({ queryKey: [NOTIFICATION_KEY] }),
			);
	}, [modrinthUser, data?.notifcations, modrinth.deleteNotifications]);

	const remove = useCallback(
		(id: Id) => {
			if (!modrinthUser) return;
			modrinth.deleteNotification(id as string).then(() =>
				queryClient.invalidateQueries({
					queryKey: [NOTIFICATION_KEY],
				}),
			);
		},
		[modrinthUser, modrinth.deleteNotification],
	);

	return {
		unreadCount: data?.read ?? 0,
		notifications: data?.notifcations ?? [],
		markAllAsRead,
		clear,
		remove,
	};
};
