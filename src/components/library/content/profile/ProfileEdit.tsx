import { Book, Copy, FolderCheck, FolderOpen, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventType, useForm } from "react-hook-form";
import {
  NavigateFunction,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { join } from "@tauri-apps/api/path";
import debounce from "lodash.debounce";

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  copy_profile,
  db,
  deleteProfile,
  showInFolder,
} from "@system/commands";
import { ProfileVersionSelector } from "./ProfileVersionSelector";
import type { MinecraftProfile } from "@lib/models/profiles";
import { TypographyH3 } from "@/components/ui/typography";
import { CATEGORY_KEY, KEY_PROFILE } from "@/hooks/keys";
import { ScrollArea } from "@component/ui/scroll-area";
import { queryClient } from "@lib/config/queryClient";
import { UNCATEGORIZEDP_GUID, categories } from "@/lib/models/categories";
import { settings } from "@/lib/models/settings";
import CategorySelect from "./CategorySelector";
import { Button } from "@/components/ui/button";
import { profile } from "@lib/models/profiles";
import { Input } from "@/components/ui/input";
import logger from "@system/logger";
import { toast } from "react-toastify";
const resolver = zodResolver(profile.schema);

const handleChange = debounce(
  async (
    ev: {
      name?:
        | "id"
        | "name"
        | "date_created"
        | "version"
        | "loader"
        | "last_played"
        | "icon"
        | "loader_version"
        | "java_args"
        | "resolution_width"
        | "resolution_height"
        | "state";
      type?: EventType;
      values?: MinecraftProfile;
    },
    navigate: NavigateFunction,
  ) => {
    let value = ev.values![ev.name!]?.toString() ?? null;
    let id = ev.values!["id"];
    if (value) {
      value = "'" + value + "'";
    } else {
      value = "NULL";
    }

    await db.execute({
      query: `UPDATE profiles SET ${ev.name}=${value} WHERE id = ?`,
      args: [id],
    });
    await queryClient.invalidateQueries({ queryKey: [KEY_PROFILE, id] });

    navigate({
      pathname: `/profile/${id}/edit`,
    });
  },
  1000,
);

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const data = useOutletContext() as MinecraftProfile;
  const form = useForm<MinecraftProfile>({
    mode: "onChange",
    resolver,
    defaultValues: data,
  });

  form.watch((_, ev) => handleChange(ev, navigate));

  return (
    <ScrollArea>
      <Form {...form}>
        <form className="space-y-4">
          <section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg ">
            <TypographyH3>Profile Settings</TypographyH3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="false"
                      placeholder="Minecraft 1.20"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    The name used for this profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="icon"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Profile Icon</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>
                          <Book className="h-4 w-4" />
                        </AvatarFallback>
                        <AvatarImage src={field.value ?? undefined} />
                      </Avatar>
                      <Input
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The icon used for this profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ProfileVersionSelector form={form} />
          </section>

          <section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
            <TypographyH3>Game Settings</TypographyH3>

            <div>
              <FormField
                name="resolution_width"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Window Width</FormLabel>
                      <FormDescription>
                        The width of the game window when launched.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Input
                        value={field.value ?? undefined}
                        onChange={(ev) => field.onChange(ev.target.value)}
                        placeholder="854"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="resolution_height"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Window Height</FormLabel>
                      <FormDescription>
                        The height of the game window when launched.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Input
                        value={field.value ?? undefined}
                        onChange={(ev) => field.onChange(ev.target.value)}
                        placeholder="480"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="java_args"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Java Args</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="false"
                        placeholder="Java Args"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Cmd arguments to pass to java on startup.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
            <TypographyH3>Organiztion</TypographyH3>

            <CategorySelect profile={form.getValues("id")} />
          </section>

          <section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
            <TypographyH3>Installation Management</TypographyH3>

            <div className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>Profile Folder</FormLabel>
                <FormDescription>Open profile Folder</FormDescription>
              </div>
              <Button
                onClick={async () => {
                  const setting = await db.select({
                    query: "SELECT * FROM settings WHERE key = 'path.app'",
                    schema: settings.schema,
                  });
                  const item = setting.at(0);
                  if (!item) return;
                  const path = await join(
                    item?.value,
                    "profiles",
                    data.id,
                    "/",
                  );

                  logger.debug(`Open path ${path}`);

                  await showInFolder(path);
                }}
                type="button"
                variant="secondary"
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                Open
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>Duplicate Profile</FormLabel>
                <FormDescription>
                  Creates a copy of this profile.
                </FormDescription>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const id = crypto.randomUUID();
                    await copy_profile(data.id, id);

                    await db.execute({
                      query:
                        "INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                      args: [
                        id,
                        data.name + " :Duplicate",
                        data.icon,
                        data.date_created,
                        data.last_played,
                        data.version,
                        data.loader,
                        data.loader_version,
                        data.java_args,
                        data.resolution_width,
                        data.resolution_height,
                        data.state,
                      ],
                    });

                    await queryClient.invalidateQueries({
                      queryKey: [CATEGORY_KEY, UNCATEGORIZEDP_GUID],
                    });
                    toast.success("Copyed profile");
                  } catch (error) {
                    console.error(error);
                    toast.error("Failed to copy", {
                      data: { error: (error as Error).message },
                    });
                  }
                }}
                type="button"
                variant="secondary"
              >
                <Copy className="mr-2 h-5 w-5" />
                Duplicate
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>Validate Content</FormLabel>
                <FormDescription>
                  Validates all downloaded content for this profile.
                </FormDescription>
              </div>

              <Button type="button">
                <FolderCheck className="mr-2 h-5 w-5" />
                Validate
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>Delete Instance</FormLabel>
                <FormDescription>
                  Fully removes a instance from the disk. Be careful, as once
                  you delete a instance there is no way to recover it.
                </FormDescription>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot undone. This will permanently delete
                      everything in this profile.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        navigate("/");
                        const cats = await db.select({
                          query: "SELECT * FROM categories WHERE profile = ?",
                          args: [data.id],
                          schema: categories.schema,
                        });
                        await db.execute({
                          query: `DELETE FROM profiles WHERE id = $1;`,
                          args: [data.id],
                        });
                        for (const cat of cats) {
                          await queryClient.invalidateQueries({
                            queryKey: [CATEGORY_KEY, cat.category],
                          });
                        }
                        await deleteProfile(data.id);
                      }}
                    >
                      Ok
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default ProfileEdit;
