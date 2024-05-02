import { useSubmit } from "react-router-dom";
import { useForm } from "react-hook-form";

import ProfileModifyRoot, { resolver } from "./ProfileModifyRoot";
import type { MinecraftProfile } from "@lib/models/profiles";
import { ScrollArea } from "@component/ui/scroll-area";
import { Form } from "@component/ui/form";

const ProfileCreate: React.FC = () => {
  const submit = useSubmit();
  const form = useForm<MinecraftProfile>({
    resolver,
    defaultValues: {
      active: false,
      console: false,
      disable_chat: false,
      disable_mulitplayer: false,
      id: crypto.randomUUID(),
      is_demo: false,
      loader: "vanilla",
      javaArgs:
        "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
      lastVersionId: "latest-release",
      name: "New Profile",
      mods: [],
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
          <ProfileModifyRoot />
        </form>
      </Form>
    </ScrollArea>
  );
};

export default ProfileCreate;
