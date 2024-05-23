import { useSubmit } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Book } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@component/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileVersionSelector } from "./ProfileVersionSelector";
import type { MinecraftProfile } from "@lib/models/profiles";
import { TypographyH3 } from "@/components/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { resolver } from "./ProfileModifyRoot";
import { Input } from "@/components/ui/input";

const ProfileCreate: React.FC = () => {
  const submit = useSubmit();
  const form = useForm<MinecraftProfile>({
    resolver,
    defaultValues: {
      id: crypto.randomUUID(),
      name: "New Profile",
      version: "latest-release",
      loader: "vanilla",
      java_args: "-Xmx2048M",
      date_created: (new Date()).toISOString(),
    },
  });

  const onSubmit = (ev: MinecraftProfile) => {
    submit(ev as never as Record<string, string>, {
      method: "POST",
      encType: "application/json",
    });
  };

  return (
    <ScrollArea>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="container flex h-full flex-col space-y-8 py-4 text-zinc-50"
        >
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


            <ProfileVersionSelector form={form} />

          </section>

          <section className="bg-zinc-900 rounded-md shadow-lg px-4 py-2 space-y-4">
            <TypographyH3>Game Settings</TypographyH3>


            <FormField
              name="resolution_width"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Window Width</FormLabel>
                    <FormDescription>The width of the game window when launched.</FormDescription>
                  </div>
                  <FormControl>
                    <Input placeholder="854" value={field.value ?? undefined} onChange={(e) => field.onChange(e.target.value)} />
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
                    <FormDescription>The height of the game window when launched.</FormDescription>
                  </div>
                  <FormControl>
                    <Input placeholder="480" value={field.value ?? undefined} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                </FormItem>
              )}
            />


            <FormField control={form.control} name="java_args" render={({ field }) => (
              <FormItem>
                <FormLabel>Java Args</FormLabel>
                <FormControl>
                  <Input autoComplete="false" placeholder="Java Args" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                </FormControl>
                <FormDescription>Command line arguments to pass to java on startup.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </section>


          <div className="absolute bottom-4 right-4">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default ProfileCreate;
