import { AlertTriangle, Box, LoaderCircle, Trash2 } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { UpdateIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { ask } from "@tauri-apps/api/dialog";
import { toast } from "react-toastify";
import { useRef } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  VersionsService,
  ProjectsService,
  VersionFilesService,
} from "@lib/api/modrinth/services.gen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TypographyH3, TypographyMuted } from "@/components/ui/typography";
import { type ContentType, workshop_content } from "@/lib/models/content";
import { db, uninstallItem } from "@/lib/system/commands";
import { MinecraftProfile } from "@/lib/models/profiles";
import { queryClient } from "@/lib/config/queryClient";
import { install_known } from "@/lib/system/install";
import { Button } from "@/components/ui/button";
import logger from "@system/logger";

async function uninstall(filename: string, type: string, profile: string) {
  try {
    if (!filename) throw new Error("Missing file name");
    await uninstallItem(type, filename, profile);

    await db.execute({
      query:
        "DELETE FROM profile_content WHERE profile = ? AND file_name = ? AND type = ?",
      args: [profile, filename, type],
    });

    await queryClient.invalidateQueries({
      queryKey: ["WORKSHOP_CONTENT", type, profile],
    });
  } catch (error) {
    console.error(error);
    logger.error((error as Error).message);
    toast.error("Failed to uninstall content", {
      data: { error: (error as Error).message },
    });
  }
}

export const ContentTab: React.FC<{
  profile: string;
  content_type: ContentType;
}> = ({ profile, content_type }) => {
  const p = useOutletContext() as MinecraftProfile;
  const container = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["WORKSHOP_CONTENT", content_type, profile],
    queryFn: async () => {
      const data = await db.select({
        query: "SELECT * FROM profile_content WHERE profile = ? AND type = ?; ",
        args: [profile, content_type],
        schema: workshop_content.schema,
      });

      const { unknownContent, hashesContent, idsContent } = data.reduce(
        (prev, cur) => {
          if (cur.id.length) {
            prev.idsContent.push(cur);
          } else if (cur.sha1) {
            prev.hashesContent.push(cur);
          } else {
            prev.unknownContent.push(cur);
          }
          return prev;
        },
        { unknownContent: [], hashesContent: [], idsContent: [] } as {
          unknownContent: typeof data;
          hashesContent: typeof data;
          idsContent: typeof data;
        },
      );

      const a = async () => {
        const ids = JSON.stringify(idsContent.map((e) => e.id));
        const projects = await ProjectsService.getProjects({ ids });
        return projects.map((e) => ({
          record: idsContent.find((c) => c.id === e.id),
          project: e,
        }));
      };

      const b = async () => {
        const hashes = await VersionFilesService.versionsFromHashes({
          requestBody: {
            algorithm: "sha1",
            hashes: hashesContent.map((e) => e.sha1),
          },
        });

        const items = Object.entries(hashes).map(([key, version]) => ({
          data: hashesContent.find((e) => e.sha1 === key),
          version,
        }));

        const projects = await ProjectsService.getProjects({
          ids: JSON.stringify(items.map((e) => e.version.project_id)),
        });

        return projects.map((e) => ({
          project: e,
          record: items.find((c) => c.version.project_id === e.id)?.data,
        }));
      };
      const c = async () => {
        return unknownContent.map((e) => ({ record: e, project: null }));
      };

      const results = await Promise.allSettled([a(), b(), c()]);

      const item = results
        .map((e) => (e.status === "fulfilled" ? e.value : null))
        .filter(Boolean)
        .flat(2);

      return item;
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: data?.length ?? 0,
    getScrollElement: () => container.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={container} className="h-full overflow-y-scroll">
      {isLoading ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div className="flex gap-2">
            <LoaderCircle className="animate-spin" />
            <pre>Loading Content</pre>
          </div>
        </div>
      ) : isError ? (
        <div className="flex h-full flex-col items-center justify-center text-zinc-50">
          <AlertTriangle />
          <TypographyH3>Something went wrong:</TypographyH3>
          <pre className="text-red-300">{error.message}</pre>
        </div>
      ) : (
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              className="absolute left-0 top-0 inline-flex w-full items-center gap-2"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Avatar className="rounded-md">
                <AvatarFallback className="rounded-md">
                  <Box />
                </AvatarFallback>
                <AvatarImage
                  src={data?.[virtualItem.index].project?.icon_url ?? undefined}
                />
              </Avatar>
              <div>
                {data?.[virtualItem.index].project ? (
                  <Link
                    className="-mb-1 line-clamp-1 underline"
                    to={`/workshop/${data?.[virtualItem.index].project?.id ?? ""}`}
                  >
                    {data?.[virtualItem.index].project?.title}
                  </Link>
                ) : (
                  <h1 className="-mb-1 line-clamp-1">
                    {data?.[virtualItem.index].project?.title ??
                      data?.[virtualItem.index].record?.file_name}
                  </h1>
                )}
                <TypographyMuted>
                  {data?.[virtualItem.index].record?.version ??
                    data?.[virtualItem.index].record?.file_name ??
                    "Unknown"}
                </TypographyMuted>
              </div>

              {data?.[virtualItem.index].project?.id ? (
                <Button
                  onClick={async () =>
                    toast.promise(
                      async () => {
                        const id = await VersionsService.getProjectVersions({
                          idSlug: data?.[virtualItem.index].project?.id!,
                          gameVersions: `["${p.version}"]`,
                          loaders:
                            p.loader !== "vanilla"
                              ? `["${p.loader}"]`
                              : undefined,
                        });
                        const version = id.at(0);
                        const currentVersionId =
                          data?.[virtualItem.index].record?.version;
                        if (
                          version &&
                          currentVersionId &&
                          version.version_number !== currentVersionId
                        ) {
                          const doUpdate = await ask(
                            `Would you like to update ${data?.[virtualItem.index].project?.title} to version (${id.at(0)?.version_number}) current is ${data?.[virtualItem.index].record?.version}`,
                            {
                              title: "Update Avaliable",
                              cancelLabel: "No",
                              okLabel: "Update",
                              type: "info",
                            },
                          );

                          if (doUpdate) {
                            await install_known(
                              version,
                              {
                                title:
                                  data?.[virtualItem.index].project?.title!,
                                type: data?.[virtualItem.index].project
                                  ?.project_type!,
                                icon: data?.[virtualItem.index].project
                                  ?.icon_url,
                              },
                              p,
                            );
                          }

                          return { didUpdate: doUpdate };
                        }

                        return { didUpdate: false };
                      },
                      {
                        pending: "Checking for update",
                        success: {
                          render({ data }) {
                            return `${data.didUpdate ? `Updating content` : `Up to date!`}`;
                          },
                        },
                        error: "Failed to check for update",
                      },
                    )
                  }
                  title="Check for update"
                  variant="ghost"
                  className="ml-auto mr-2 h-5 w-5"
                  size="icon"
                >
                  <UpdateIcon className="h-5 w-5 hover:animate-spin" />
                </Button>
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" title="Delete Mod">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will delete this content, and can not be
                      undone. Deleting this may also break this install if this
                      content is a dependency of other content that is
                      installed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        uninstall(
                          data?.[virtualItem.index].record?.file_name!,
                          content_type,
                          profile,
                        )
                      }
                    >
                      Ok
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
