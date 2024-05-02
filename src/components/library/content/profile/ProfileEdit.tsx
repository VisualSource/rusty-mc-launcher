import { useLoaderData, useSubmit } from "react-router-dom";
import { useForm } from "react-hook-form";

import ProfileModifyRoot, { resolver } from "./ProfileModifyRoot";
import type { MinecraftProfile } from "@lib/models/profiles";
import { ScrollArea } from "@component/ui/scroll-area";
import { Form } from "@/components/ui/form";

const ProfileEdit: React.FC = () => {
  const data = useLoaderData() as MinecraftProfile;
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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="container flex h-full flex-col space-y-8 py-4 text-zinc-50"
        >
          <ProfileModifyRoot editMods />
        </form>
      </Form>
    </ScrollArea>
  );
};

export default ProfileEdit;
