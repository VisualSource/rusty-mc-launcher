import { useOutletContext, useSubmit, } from "react-router-dom";
import { useForm } from "react-hook-form";

import { resolver } from "./ProfileModifyRoot";
import type { MinecraftProfile } from "@lib/models/profiles";
import { ScrollArea } from "@component/ui/scroll-area";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TypographyH3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Switch } from "@component/ui/switch";


import { ProfileVersionSelector } from "./ProfileVersionSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Book } from "lucide-react";
const ProfileEdit: React.FC = () => {
  const data = useOutletContext() as MinecraftProfile;

  const submit = useSubmit();
  const form = useForm<MinecraftProfile>({
    resolver,
    defaultValues: data,
  });

  const onSubmit = (ev: MinecraftProfile) => {
    submit(ev as never as Record<string, string>, {
      method: "PATCH",
      encType: "application/json",
    });
  };


  return (
    <ScrollArea>
      <Form {...form}>
        <form className="space-y-4">
          <section className="bg-zinc-900 rounded-md shadow-lg px-4 py-2 space-y-4">
            <TypographyH3>Profile Settings</TypographyH3>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Name</FormLabel>
                <FormControl>
                  <Input autoComplete="false" placeholder="Minecraft 1.20" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                </FormControl>
                <FormDescription>The name used for this profile.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField
              name="icon"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Profile Icon</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Avatar>
                        <AvatarFallback>
                          <Book className="h-4 w-4" />
                        </AvatarFallback>
                        <AvatarImage src={field.value ?? undefined} />
                      </Avatar>
                      <Input value={field.value ?? ""} onChange={field.onChange} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The icon used for this profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              defaultValue="latest-release"
              control={form.control}
              name="lastVersionId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Minecraft Version</FormLabel>
                  <FormControl>
                    <ProfileVersionSelector onChange={(e) => field.onChange(e)} lastVersionId={field.value} />
                  </FormControl>
                  <FormDescription>
                    This is the version of that game that will be used.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

          </section>

          <section className="bg-zinc-900 rounded-md shadow-lg px-4 py-2 space-y-4">
            <TypographyH3>Game Settings</TypographyH3>

            <div>
              <FormField
                name="resolution.width"
                defaultValue={854}
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Window Width</FormLabel>
                      <FormDescription>The width of the game window when launched.</FormDescription>
                    </div>
                    <FormControl>
                      <Input placeholder="854" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="resolution.height"
                defaultValue={480}
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Window Height</FormLabel>
                      <FormDescription>The height of the game window when launched.</FormDescription>
                    </div>
                    <FormControl>
                      <Input placeholder="480" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="console"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Console</FormLabel>
                      <FormDescription>Display java terminal.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="javaDir" render={({ field }) => (
                <FormItem>
                  <FormLabel>Java</FormLabel>
                  <FormControl>
                    <Input autoComplete="false" placeholder="Java" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormDescription>Java installation directory</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="javaArgs" render={({ field }) => (
                <FormItem>
                  <FormLabel>Java Args</FormLabel>
                  <FormControl>
                    <Input autoComplete="false" placeholder="Java Args" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormDescription>Cmd arguments to pass to java on startup.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </section>

          <section className="bg-zinc-900 rounded-md shadow-lg px-4 py-2 space-y-4">
            <TypographyH3>Installation Management</TypographyH3>

            <div className="flex items-center gap-4 justify-between">
              <div>
                <FormLabel>Duplicate Profile</FormLabel>
                <FormDescription>Creates a copy of this profile.</FormDescription>
              </div>
              <Button variant="secondary">Duplicate</Button>
            </div>

            <div className="flex items-center gap-4 justify-between">
              <div>
                <FormLabel>Validate Content</FormLabel>
                <FormDescription>Validates all downloaded content for this profile.</FormDescription>
              </div>

              <Button>Validate</Button>
            </div>

            <div className="flex items-center gap-4 justify-between">
              <div>
                <FormLabel>Delete Instance</FormLabel>
                <FormDescription>Fully removes a instance from the disk. Be careful, as once you delete a instance there is no way to recover it.</FormDescription>
              </div>

              <Button variant="destructive">Delete</Button>
            </div>
          </section>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default ProfileEdit;
