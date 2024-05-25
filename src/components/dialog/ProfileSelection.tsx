import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { coerce, satisfies } from "semver";
import { useForm } from "react-hook-form";
import { Book } from "lucide-react";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useProfiles } from "@hook/useProfiles";
//import { getLoaderType } from "@/utils/versionUtils";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
  showAll: z.boolean(),
  profile: z.string().uuid(),
});

const KEY = "mcl::open::profile-select";
const RETURN_KEY = "mcl::return::profile-select";

export const selectProfile = async (limit?: {
  modloaders?: string[];
  minecraft_versions?: string[];
}): Promise<string | null> => {
  return new Promise((resolve) => {
    window.addEventListener(
      RETURN_KEY,
      (ev) => {
        const { id } = (ev as CustomEvent<{ id: string | null }>).detail;
        resolve(id);
      },
      { once: true },
    );

    window.dispatchEvent(new CustomEvent(KEY, { detail: limit }));
  });
};

const SelectProfile: React.FC = () => {
  return null;
};

export default SelectProfile;
