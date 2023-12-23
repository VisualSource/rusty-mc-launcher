import { Component } from "lucide-react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useCategories from "@/lib/hooks/useCategories";
import { Button } from "@component/ui/button";
import { Label } from "@/components/ui/label";
import { Form } from "react-router-dom";
import { useState } from "react";

const AddToCategory: React.FC<{ id: string }> = ({ id }) => {
  const [open, setOpen] = useState(false);
  const categories = useCategories();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button title="Add to collection" size="icon">
          <Component />
        </Button>
      </DialogTrigger>
      <DialogContent className="text-zinc-50">
        <DialogHeader>
          <DialogTitle>Collections</DialogTitle>
          <DialogDescription>Add this profile to Collections</DialogDescription>
        </DialogHeader>
        <Form
          onSubmit={() => setOpen(false)}
          method="POST"
          action="/collection"
        >
          <input name="id" defaultValue={id} className="hidden" />
          <Label>Collections</Label>
          <Select name="collection">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Collections</SelectLabel>
                {categories.map((value) => (
                  <SelectItem
                    key={value.group_id}
                    value={value.group_id.toString()}
                  >
                    {value.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <DialogFooter className="pt-4">
            <Button type="submit">Add</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCategory;
