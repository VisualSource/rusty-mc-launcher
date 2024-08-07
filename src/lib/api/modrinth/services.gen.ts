// This file is auto-generated by @hey-api/openapi-ts

import {
	client,
	type Options,
	formDataBodySerializer,
} from "@hey-api/client-fetch";
import type {
	SearchProjectsData,
	SearchProjectsError,
	SearchProjectsResponse,
	GetProjectData,
	GetProjectError,
	GetProjectResponse,
	ModifyProjectData,
	ModifyProjectError,
	ModifyProjectResponse,
	DeleteProjectData,
	DeleteProjectError,
	DeleteProjectResponse,
	GetProjectsData,
	GetProjectsError,
	GetProjectsResponse,
	PatchProjectsData,
	PatchProjectsError,
	PatchProjectsResponse,
	RandomProjectsData,
	RandomProjectsError,
	RandomProjectsResponse,
	CreateProjectData,
	CreateProjectError,
	CreateProjectResponse,
	ChangeProjectIconData,
	ChangeProjectIconError,
	ChangeProjectIconResponse,
	DeleteProjectIconData,
	DeleteProjectIconError,
	DeleteProjectIconResponse,
	CheckProjectValidityData,
	CheckProjectValidityError,
	CheckProjectValidityResponse,
	AddGalleryImageData,
	AddGalleryImageError,
	AddGalleryImageResponse,
	ModifyGalleryImageData,
	ModifyGalleryImageError,
	ModifyGalleryImageResponse,
	DeleteGalleryImageData,
	DeleteGalleryImageError,
	DeleteGalleryImageResponse,
	GetDependenciesData,
	GetDependenciesError,
	GetDependenciesResponse,
	FollowProjectData,
	FollowProjectError,
	FollowProjectResponse,
	UnfollowProjectData,
	UnfollowProjectError,
	UnfollowProjectResponse,
	ScheduleProjectData,
	ScheduleProjectError,
	ScheduleProjectResponse,
	GetProjectVersionsData,
	GetProjectVersionsError,
	GetProjectVersionsResponse,
	GetVersionData,
	GetVersionError,
	GetVersionResponse,
	ModifyVersionData,
	ModifyVersionError,
	ModifyVersionResponse,
	DeleteVersionData,
	DeleteVersionError,
	DeleteVersionResponse,
	GetVersionFromIdOrNumberData,
	GetVersionFromIdOrNumberError,
	GetVersionFromIdOrNumberResponse,
	CreateVersionData,
	CreateVersionError,
	CreateVersionResponse,
	ScheduleVersionData,
	ScheduleVersionError,
	ScheduleVersionResponse,
	GetVersionsData,
	GetVersionsError,
	GetVersionsResponse,
	AddFilesToVersionData,
	AddFilesToVersionError,
	AddFilesToVersionResponse,
	VersionFromHashData,
	VersionFromHashError,
	VersionFromHashResponse,
	DeleteFileFromHashData,
	DeleteFileFromHashError,
	DeleteFileFromHashResponse,
	GetLatestVersionFromHashData,
	GetLatestVersionFromHashError,
	GetLatestVersionFromHashResponse,
	VersionsFromHashesData,
	VersionsFromHashesError,
	VersionsFromHashesResponse,
	GetLatestVersionsFromHashesData,
	GetLatestVersionsFromHashesError,
	GetLatestVersionsFromHashesResponse,
	GetUserData,
	GetUserError,
	GetUserResponse,
	ModifyUserData,
	ModifyUserError,
	ModifyUserResponse,
	GetUserFromAuthError,
	GetUserFromAuthResponse,
	GetUsersData,
	GetUsersError,
	GetUsersResponse,
	ChangeUserIconData,
	ChangeUserIconError,
	ChangeUserIconResponse,
	GetUserProjectsData,
	GetUserProjectsError,
	GetUserProjectsResponse,
	GetFollowedProjectsData,
	GetFollowedProjectsError,
	GetFollowedProjectsResponse,
	GetPayoutHistoryData,
	GetPayoutHistoryError,
	GetPayoutHistoryResponse,
	WithdrawPayoutData,
	WithdrawPayoutError,
	WithdrawPayoutResponse,
	GetUserNotificationsData,
	GetUserNotificationsError,
	GetUserNotificationsResponse,
	GetNotificationData,
	GetNotificationError,
	GetNotificationResponse,
	ReadNotificationData,
	ReadNotificationError,
	ReadNotificationResponse,
	DeleteNotificationData,
	DeleteNotificationError,
	DeleteNotificationResponse,
	GetNotificationsData,
	GetNotificationsError,
	GetNotificationsResponse,
	ReadNotificationsData,
	ReadNotificationsError,
	ReadNotificationsResponse,
	DeleteNotificationsData,
	DeleteNotificationsError,
	DeleteNotificationsResponse,
	SubmitReportData,
	SubmitReportError,
	SubmitReportResponse,
	GetOpenReportsData,
	GetOpenReportsError,
	GetOpenReportsResponse,
	GetReportData,
	GetReportError,
	GetReportResponse,
	ModifyReportData,
	ModifyReportError,
	ModifyReportResponse,
	GetReportsData,
	GetReportsError,
	GetReportsResponse,
	GetThreadData,
	GetThreadError,
	GetThreadResponse,
	SendThreadMessageData,
	SendThreadMessageError,
	SendThreadMessageResponse,
	GetThreadsData,
	GetThreadsError,
	GetThreadsResponse,
	DeleteThreadMessageData,
	DeleteThreadMessageError,
	DeleteThreadMessageResponse,
	GetProjectTeamMembersData,
	GetProjectTeamMembersError,
	GetProjectTeamMembersResponse,
	GetTeamMembersData,
	GetTeamMembersError,
	GetTeamMembersResponse,
	AddTeamMemberData,
	AddTeamMemberError,
	AddTeamMemberResponse,
	GetTeamsData,
	GetTeamsError,
	GetTeamsResponse,
	JoinTeamData,
	JoinTeamError,
	JoinTeamResponse,
	ModifyTeamMemberData,
	ModifyTeamMemberError,
	ModifyTeamMemberResponse,
	DeleteTeamMemberData,
	DeleteTeamMemberError,
	DeleteTeamMemberResponse,
	TransferTeamOwnershipData,
	TransferTeamOwnershipError,
	TransferTeamOwnershipResponse,
	CategoryListError,
	CategoryListResponse,
	LoaderListError,
	LoaderListResponse,
	VersionListError,
	VersionListResponse,
	LicenseListError,
	LicenseListResponse,
	LicenseTextData,
	LicenseTextError,
	LicenseTextResponse,
	DonationPlatformListError,
	DonationPlatformListResponse,
	ReportTypeListError,
	ReportTypeListResponse,
	ProjectTypeListError,
	ProjectTypeListResponse,
	SideTypeListError,
	SideTypeListResponse,
	ForgeUpdatesData,
	ForgeUpdatesError,
	ForgeUpdatesResponse,
	StatisticsError,
	StatisticsResponse,
} from "./types.gen";

/**
 * Search projects
 */
export const searchProjects = (options?: Options<SearchProjectsData>) => {
	return (options?.client ?? client).get<
		SearchProjectsResponse,
		SearchProjectsError
	>({
		...options,
		url: "/search",
	});
};

/**
 * Get a project
 */
export const getProject = (options: Options<GetProjectData>) => {
	return (options?.client ?? client).get<GetProjectResponse, GetProjectError>({
		...options,
		url: "/project/{id|slug}",
	});
};

/**
 * Modify a project
 */
export const modifyProject = (options: Options<ModifyProjectData>) => {
	return (options?.client ?? client).patch<
		ModifyProjectResponse,
		ModifyProjectError
	>({
		...options,
		url: "/project/{id|slug}",
	});
};

/**
 * Delete a project
 */
export const deleteProject = (options: Options<DeleteProjectData>) => {
	return (options?.client ?? client).delete<
		DeleteProjectResponse,
		DeleteProjectError
	>({
		...options,
		url: "/project/{id|slug}",
	});
};

/**
 * Get multiple projects
 */
export const getProjects = (options: Options<GetProjectsData>) => {
	return (options?.client ?? client).get<GetProjectsResponse, GetProjectsError>(
		{
			...options,
			url: "/projects",
		},
	);
};

/**
 * Bulk-edit multiple projects
 */
export const patchProjects = (options: Options<PatchProjectsData>) => {
	return (options?.client ?? client).patch<
		PatchProjectsResponse,
		PatchProjectsError
	>({
		...options,
		url: "/projects",
	});
};

/**
 * Get a list of random projects
 */
export const randomProjects = (options: Options<RandomProjectsData>) => {
	return (options?.client ?? client).get<
		RandomProjectsResponse,
		RandomProjectsError
	>({
		...options,
		url: "/projects_random",
	});
};

/**
 * Create a project
 */
export const createProject = (options?: Options<CreateProjectData>) => {
	return (options?.client ?? client).post<
		CreateProjectResponse,
		CreateProjectError
	>({
		...options,
		...formDataBodySerializer,
		url: "/project",
	});
};

/**
 * Change project's icon
 * The new icon may be up to 256KiB in size.
 */
export const changeProjectIcon = (options: Options<ChangeProjectIconData>) => {
	return (options?.client ?? client).patch<
		ChangeProjectIconResponse,
		ChangeProjectIconError
	>({
		...options,
		url: "/project/{id|slug}/icon",
	});
};

/**
 * Delete project's icon
 */
export const deleteProjectIcon = (options: Options<DeleteProjectIconData>) => {
	return (options?.client ?? client).delete<
		DeleteProjectIconResponse,
		DeleteProjectIconError
	>({
		...options,
		url: "/project/{id|slug}/icon",
	});
};

/**
 * Check project slug/ID validity
 */
export const checkProjectValidity = (
	options: Options<CheckProjectValidityData>,
) => {
	return (options?.client ?? client).get<
		CheckProjectValidityResponse,
		CheckProjectValidityError
	>({
		...options,
		url: "/project/{id|slug}/check",
	});
};

/**
 * Add a gallery image
 * Modrinth allows you to upload files of up to 5MiB to a project's gallery.
 */
export const addGalleryImage = (options: Options<AddGalleryImageData>) => {
	return (options?.client ?? client).post<
		AddGalleryImageResponse,
		AddGalleryImageError
	>({
		...options,
		url: "/project/{id|slug}/gallery",
	});
};

/**
 * Modify a gallery image
 */
export const modifyGalleryImage = (
	options: Options<ModifyGalleryImageData>,
) => {
	return (options?.client ?? client).patch<
		ModifyGalleryImageResponse,
		ModifyGalleryImageError
	>({
		...options,
		url: "/project/{id|slug}/gallery",
	});
};

/**
 * Delete a gallery image
 */
export const deleteGalleryImage = (
	options: Options<DeleteGalleryImageData>,
) => {
	return (options?.client ?? client).delete<
		DeleteGalleryImageResponse,
		DeleteGalleryImageError
	>({
		...options,
		url: "/project/{id|slug}/gallery",
	});
};

/**
 * Get all of a project's dependencies
 */
export const getDependencies = (options: Options<GetDependenciesData>) => {
	return (options?.client ?? client).get<
		GetDependenciesResponse,
		GetDependenciesError
	>({
		...options,
		url: "/project/{id|slug}/dependencies",
	});
};

/**
 * Follow a project
 */
export const followProject = (options: Options<FollowProjectData>) => {
	return (options?.client ?? client).post<
		FollowProjectResponse,
		FollowProjectError
	>({
		...options,
		url: "/project/{id|slug}/follow",
	});
};

/**
 * Unfollow a project
 */
export const unfollowProject = (options: Options<UnfollowProjectData>) => {
	return (options?.client ?? client).delete<
		UnfollowProjectResponse,
		UnfollowProjectError
	>({
		...options,
		url: "/project/{id|slug}/follow",
	});
};

/**
 * Schedule a project
 */
export const scheduleProject = (options: Options<ScheduleProjectData>) => {
	return (options?.client ?? client).post<
		ScheduleProjectResponse,
		ScheduleProjectError
	>({
		...options,
		url: "/project/{id|slug}/schedule",
	});
};

/**
 * List project's versions
 */
export const getProjectVersions = (
	options: Options<GetProjectVersionsData>,
) => {
	return (options?.client ?? client).get<
		GetProjectVersionsResponse,
		GetProjectVersionsError
	>({
		...options,
		url: "/project/{id|slug}/version",
	});
};

/**
 * Get a version
 */
export const getVersion = (options: Options<GetVersionData>) => {
	return (options?.client ?? client).get<GetVersionResponse, GetVersionError>({
		...options,
		url: "/version/{id}",
	});
};

/**
 * Modify a version
 */
export const modifyVersion = (options: Options<ModifyVersionData>) => {
	return (options?.client ?? client).patch<
		ModifyVersionResponse,
		ModifyVersionError
	>({
		...options,
		url: "/version/{id}",
	});
};

/**
 * Delete a version
 */
export const deleteVersion = (options: Options<DeleteVersionData>) => {
	return (options?.client ?? client).delete<
		DeleteVersionResponse,
		DeleteVersionError
	>({
		...options,
		url: "/version/{id}",
	});
};

/**
 * Get a version given a version number or ID
 * Please note that, if the version number provided matches multiple versions, only the **oldest matching version** will be returned.
 */
export const getVersionFromIdOrNumber = (
	options: Options<GetVersionFromIdOrNumberData>,
) => {
	return (options?.client ?? client).get<
		GetVersionFromIdOrNumberResponse,
		GetVersionFromIdOrNumberError
	>({
		...options,
		url: "/project/{id|slug}/version/{id|number}",
	});
};

/**
 * Create a version
 * This route creates a version on an existing project. There must be at least one file attached to each new version, unless the new version's status is `draft`. `.mrpack`, `.jar`, `.zip`, and `.litemod` files are accepted.
 *
 * The request is a [multipart request](https://www.ietf.org/rfc/rfc2388.txt) with at least two form fields: one is `data`, which includes a JSON body with the version metadata as shown below, and at least one field containing an upload file.
 *
 * You can name the file parts anything you would like, but you must list each of the parts' names in `file_parts`, and optionally, provide one to use as the primary file in `primary_file`.
 *
 */
export const createVersion = (options?: Options<CreateVersionData>) => {
	return (options?.client ?? client).post<
		CreateVersionResponse,
		CreateVersionError
	>({
		...options,
		...formDataBodySerializer,
		url: "/version",
	});
};

/**
 * Schedule a version
 */
export const scheduleVersion = (options: Options<ScheduleVersionData>) => {
	return (options?.client ?? client).post<
		ScheduleVersionResponse,
		ScheduleVersionError
	>({
		...options,
		url: "/version/{id}/schedule",
	});
};

/**
 * Get multiple versions
 */
export const getVersions = (options: Options<GetVersionsData>) => {
	return (options?.client ?? client).get<GetVersionsResponse, GetVersionsError>(
		{
			...options,
			url: "/versions",
		},
	);
};

/**
 * Add files to version
 * Project files are attached. `.mrpack` and `.jar` files are accepted.
 */
export const addFilesToVersion = (options: Options<AddFilesToVersionData>) => {
	return (options?.client ?? client).post<
		AddFilesToVersionResponse,
		AddFilesToVersionError
	>({
		...options,
		...formDataBodySerializer,
		url: "/version/{id}/file",
	});
};

/**
 * Get version from hash
 */
export const versionFromHash = (options: Options<VersionFromHashData>) => {
	return (options?.client ?? client).get<
		VersionFromHashResponse,
		VersionFromHashError
	>({
		...options,
		url: "/version_file/{hash}",
	});
};

/**
 * Delete a file from its hash
 */
export const deleteFileFromHash = (
	options: Options<DeleteFileFromHashData>,
) => {
	return (options?.client ?? client).delete<
		DeleteFileFromHashResponse,
		DeleteFileFromHashError
	>({
		...options,
		url: "/version_file/{hash}",
	});
};

/**
 * Latest version of a project from a hash, loader(s), and game version(s)
 */
export const getLatestVersionFromHash = (
	options: Options<GetLatestVersionFromHashData>,
) => {
	return (options?.client ?? client).post<
		GetLatestVersionFromHashResponse,
		GetLatestVersionFromHashError
	>({
		...options,
		url: "/version_file/{hash}/update",
	});
};

/**
 * Get versions from hashes
 * This is the same as [`/version_file/{hash}`](#operation/versionFromHash) except it accepts multiple hashes.
 */
export const versionsFromHashes = (
	options?: Options<VersionsFromHashesData>,
) => {
	return (options?.client ?? client).post<
		VersionsFromHashesResponse,
		VersionsFromHashesError
	>({
		...options,
		url: "/version_files",
	});
};

/**
 * Latest versions of multiple project from hashes, loader(s), and game version(s)
 * This is the same as [`/version_file/{hash}/update`](#operation/getLatestVersionFromHash) except it accepts multiple hashes.
 */
export const getLatestVersionsFromHashes = (
	options?: Options<GetLatestVersionsFromHashesData>,
) => {
	return (options?.client ?? client).post<
		GetLatestVersionsFromHashesResponse,
		GetLatestVersionsFromHashesError
	>({
		...options,
		url: "/version_files/update",
	});
};

/**
 * Get a user
 */
export const getUser = (options: Options<GetUserData>) => {
	return (options?.client ?? client).get<GetUserResponse, GetUserError>({
		...options,
		url: "/user/{id|username}",
	});
};

/**
 * Modify a user
 */
export const modifyUser = (options: Options<ModifyUserData>) => {
	return (options?.client ?? client).patch<ModifyUserResponse, ModifyUserError>(
		{
			...options,
			url: "/user/{id|username}",
		},
	);
};

/**
 * Get user from authorization header
 */
export const getUserFromAuth = (options?: Options) => {
	return (options?.client ?? client).get<
		GetUserFromAuthResponse,
		GetUserFromAuthError
	>({
		...options,
		url: "/user",
	});
};

/**
 * Get multiple users
 */
export const getUsers = (options: Options<GetUsersData>) => {
	return (options?.client ?? client).get<GetUsersResponse, GetUsersError>({
		...options,
		url: "/users",
	});
};

/**
 * Change user's avatar
 * The new avatar may be up to 2MiB in size.
 */
export const changeUserIcon = (options: Options<ChangeUserIconData>) => {
	return (options?.client ?? client).patch<
		ChangeUserIconResponse,
		ChangeUserIconError
	>({
		...options,
		url: "/user/{id|username}/icon",
	});
};

/**
 * Get user's projects
 */
export const getUserProjects = (options: Options<GetUserProjectsData>) => {
	return (options?.client ?? client).get<
		GetUserProjectsResponse,
		GetUserProjectsError
	>({
		...options,
		url: "/user/{id|username}/projects",
	});
};

/**
 * Get user's followed projects
 */
export const getFollowedProjects = (
	options: Options<GetFollowedProjectsData>,
) => {
	return (options?.client ?? client).get<
		GetFollowedProjectsResponse,
		GetFollowedProjectsError
	>({
		...options,
		url: "/user/{id|username}/follows",
	});
};

/**
 * Get user's payout history
 */
export const getPayoutHistory = (options: Options<GetPayoutHistoryData>) => {
	return (options?.client ?? client).get<
		GetPayoutHistoryResponse,
		GetPayoutHistoryError
	>({
		...options,
		url: "/user/{id|username}/payouts",
	});
};

/**
 * Withdraw payout balance to PayPal or Venmo
 * Warning: certain amounts get withheld for fees. Please do not call this API endpoint without first acknowledging the warnings on the corresponding frontend page.
 */
export const withdrawPayout = (options: Options<WithdrawPayoutData>) => {
	return (options?.client ?? client).post<
		WithdrawPayoutResponse,
		WithdrawPayoutError
	>({
		...options,
		url: "/user/{id|username}/payouts",
	});
};

/**
 * Get user's notifications
 */
export const getUserNotifications = (
	options: Options<GetUserNotificationsData>,
) => {
	return (options?.client ?? client).get<
		GetUserNotificationsResponse,
		GetUserNotificationsError
	>({
		...options,
		url: "/user/{id|username}/notifications",
	});
};

/**
 * Get notification from ID
 */
export const getNotification = (options: Options<GetNotificationData>) => {
	return (options?.client ?? client).get<
		GetNotificationResponse,
		GetNotificationError
	>({
		...options,
		url: "/notification/{id}",
	});
};

/**
 * Mark notification as read
 */
export const readNotification = (options: Options<ReadNotificationData>) => {
	return (options?.client ?? client).patch<
		ReadNotificationResponse,
		ReadNotificationError
	>({
		...options,
		url: "/notification/{id}",
	});
};

/**
 * Delete notification
 */
export const deleteNotification = (
	options: Options<DeleteNotificationData>,
) => {
	return (options?.client ?? client).delete<
		DeleteNotificationResponse,
		DeleteNotificationError
	>({
		...options,
		url: "/notification/{id}",
	});
};

/**
 * Get multiple notifications
 */
export const getNotifications = (options: Options<GetNotificationsData>) => {
	return (options?.client ?? client).get<
		GetNotificationsResponse,
		GetNotificationsError
	>({
		...options,
		url: "/notifications",
	});
};

/**
 * Mark multiple notifications as read
 */
export const readNotifications = (options: Options<ReadNotificationsData>) => {
	return (options?.client ?? client).patch<
		ReadNotificationsResponse,
		ReadNotificationsError
	>({
		...options,
		url: "/notifications",
	});
};

/**
 * Delete multiple notifications
 */
export const deleteNotifications = (
	options: Options<DeleteNotificationsData>,
) => {
	return (options?.client ?? client).delete<
		DeleteNotificationsResponse,
		DeleteNotificationsError
	>({
		...options,
		url: "/notifications",
	});
};

/**
 * Report a project, user, or version
 * Bring a project, user, or version to the attention of the moderators by reporting it.
 */
export const submitReport = (options?: Options<SubmitReportData>) => {
	return (options?.client ?? client).post<
		SubmitReportResponse,
		SubmitReportError
	>({
		...options,
		url: "/report",
	});
};

/**
 * Get your open reports
 */
export const getOpenReports = (options?: Options<GetOpenReportsData>) => {
	return (options?.client ?? client).get<
		GetOpenReportsResponse,
		GetOpenReportsError
	>({
		...options,
		url: "/report",
	});
};

/**
 * Get report from ID
 */
export const getReport = (options: Options<GetReportData>) => {
	return (options?.client ?? client).get<GetReportResponse, GetReportError>({
		...options,
		url: "/report/{id}",
	});
};

/**
 * Modify a report
 */
export const modifyReport = (options: Options<ModifyReportData>) => {
	return (options?.client ?? client).patch<
		ModifyReportResponse,
		ModifyReportError
	>({
		...options,
		url: "/report/{id}",
	});
};

/**
 * Get multiple reports
 */
export const getReports = (options: Options<GetReportsData>) => {
	return (options?.client ?? client).get<GetReportsResponse, GetReportsError>({
		...options,
		url: "/reports",
	});
};

/**
 * Get a thread
 */
export const getThread = (options: Options<GetThreadData>) => {
	return (options?.client ?? client).get<GetThreadResponse, GetThreadError>({
		...options,
		url: "/thread/{id}",
	});
};

/**
 * Send a text message to a thread
 */
export const sendThreadMessage = (options: Options<SendThreadMessageData>) => {
	return (options?.client ?? client).post<
		SendThreadMessageResponse,
		SendThreadMessageError
	>({
		...options,
		url: "/thread/{id}",
	});
};

/**
 * Get multiple threads
 */
export const getThreads = (options: Options<GetThreadsData>) => {
	return (options?.client ?? client).get<GetThreadsResponse, GetThreadsError>({
		...options,
		url: "/threads",
	});
};

/**
 * Delete a thread message
 */
export const deleteThreadMessage = (
	options: Options<DeleteThreadMessageData>,
) => {
	return (options?.client ?? client).delete<
		DeleteThreadMessageResponse,
		DeleteThreadMessageError
	>({
		...options,
		url: "/message/{id}",
	});
};

/**
 * Get a project's team members
 */
export const getProjectTeamMembers = (
	options: Options<GetProjectTeamMembersData>,
) => {
	return (options?.client ?? client).get<
		GetProjectTeamMembersResponse,
		GetProjectTeamMembersError
	>({
		...options,
		url: "/project/{id|slug}/members",
	});
};

/**
 * Get a team's members
 */
export const getTeamMembers = (options: Options<GetTeamMembersData>) => {
	return (options?.client ?? client).get<
		GetTeamMembersResponse,
		GetTeamMembersError
	>({
		...options,
		url: "/team/{id}/members",
	});
};

/**
 * Add a user to a team
 */
export const addTeamMember = (options: Options<AddTeamMemberData>) => {
	return (options?.client ?? client).post<
		AddTeamMemberResponse,
		AddTeamMemberError
	>({
		...options,
		url: "/team/{id}/members",
	});
};

/**
 * Get the members of multiple teams
 */
export const getTeams = (options: Options<GetTeamsData>) => {
	return (options?.client ?? client).get<GetTeamsResponse, GetTeamsError>({
		...options,
		url: "/teams",
	});
};

/**
 * Join a team
 */
export const joinTeam = (options: Options<JoinTeamData>) => {
	return (options?.client ?? client).post<JoinTeamResponse, JoinTeamError>({
		...options,
		url: "/team/{id}/join",
	});
};

/**
 * Modify a team member's information
 */
export const modifyTeamMember = (options: Options<ModifyTeamMemberData>) => {
	return (options?.client ?? client).patch<
		ModifyTeamMemberResponse,
		ModifyTeamMemberError
	>({
		...options,
		url: "/team/{id}/members/{id|username}",
	});
};

/**
 * Remove a member from a team
 */
export const deleteTeamMember = (options: Options<DeleteTeamMemberData>) => {
	return (options?.client ?? client).delete<
		DeleteTeamMemberResponse,
		DeleteTeamMemberError
	>({
		...options,
		url: "/team/{id}/members/{id|username}",
	});
};

/**
 * Transfer team's ownership to another user
 */
export const transferTeamOwnership = (
	options: Options<TransferTeamOwnershipData>,
) => {
	return (options?.client ?? client).patch<
		TransferTeamOwnershipResponse,
		TransferTeamOwnershipError
	>({
		...options,
		url: "/team/{id}/owner",
	});
};

/**
 * Get a list of categories
 * Gets an array of categories, their icons, and applicable project types
 */
export const categoryList = (options?: Options) => {
	return (options?.client ?? client).get<
		CategoryListResponse,
		CategoryListError
	>({
		...options,
		url: "/tag/category",
	});
};

/**
 * Get a list of loaders
 * Gets an array of loaders, their icons, and supported project types
 */
export const loaderList = (options?: Options) => {
	return (options?.client ?? client).get<LoaderListResponse, LoaderListError>({
		...options,
		url: "/tag/loader",
	});
};

/**
 * Get a list of game versions
 * Gets an array of game versions and information about them
 */
export const versionList = (options?: Options) => {
	return (options?.client ?? client).get<VersionListResponse, VersionListError>(
		{
			...options,
			url: "/tag/game_version",
		},
	);
};

/**
 * @deprecated
 * Get a list of licenses
 * Deprecated - simply use SPDX IDs.
 */
export const licenseList = (options?: Options) => {
	return (options?.client ?? client).get<LicenseListResponse, LicenseListError>(
		{
			...options,
			url: "/tag/license",
		},
	);
};

/**
 * Get the text and title of a license
 */
export const licenseText = (options: Options<LicenseTextData>) => {
	return (options?.client ?? client).get<LicenseTextResponse, LicenseTextError>(
		{
			...options,
			url: "/tag/license/{id}",
		},
	);
};

/**
 * Get a list of donation platforms
 * Gets an array of donation platforms and information about them
 */
export const donationPlatformList = (options?: Options) => {
	return (options?.client ?? client).get<
		DonationPlatformListResponse,
		DonationPlatformListError
	>({
		...options,
		url: "/tag/donation_platform",
	});
};

/**
 * Get a list of report types
 * Gets an array of valid report types
 */
export const reportTypeList = (options?: Options) => {
	return (options?.client ?? client).get<
		ReportTypeListResponse,
		ReportTypeListError
	>({
		...options,
		url: "/tag/report_type",
	});
};

/**
 * Get a list of project types
 * Gets an array of valid project types
 */
export const projectTypeList = (options?: Options) => {
	return (options?.client ?? client).get<
		ProjectTypeListResponse,
		ProjectTypeListError
	>({
		...options,
		url: "/tag/project_type",
	});
};

/**
 * Get a list of side types
 * Gets an array of valid side types
 */
export const sideTypeList = (options?: Options) => {
	return (options?.client ?? client).get<
		SideTypeListResponse,
		SideTypeListError
	>({
		...options,
		url: "/tag/side_type",
	});
};

/**
 * Forge Updates JSON file
 * If you're a Forge mod developer, your Modrinth mods have an automatically generated `updates.json` using the
 * [Forge Update Checker](https://docs.minecraftforge.net/en/latest/misc/updatechecker/).
 *
 * The only setup is to insert the URL into the `[[mods]]` section of your `mods.toml` file as such:
 *
 * ```toml
 * [[mods]]
 * # the other stuff here - ID, version, display name, etc.
 * updateJSONURL = "https://api.modrinth.com/updates/{slug|ID}/forge_updates.json"
 * ```
 *
 * Replace `{slug|id}` with the slug or ID of your project.
 *
 * Modrinth will handle the rest! When you update your mod, Forge will notify your users that their copy of your mod is out of date.
 *
 * Make sure that the version format you use for your Modrinth releases is the same as the version format you use in your `mods.toml`.
 * If you use a format such as `1.2.3-forge` or `1.2.3+1.19` with your Modrinth releases but your `mods.toml` only has `1.2.3`,
 * the update checker may not function properly.
 *
 */
export const forgeUpdates = (options: Options<ForgeUpdatesData>) => {
	return (options?.client ?? client).get<
		ForgeUpdatesResponse,
		ForgeUpdatesError
	>({
		...options,
		url: "/updates/{id|slug}/forge_updates.json",
	});
};

/**
 * Various statistics about this Modrinth instance
 */
export const statistics = (options?: Options) => {
	return (options?.client ?? client).get<StatisticsResponse, StatisticsError>({
		...options,
		url: "/statistics",
	});
};
