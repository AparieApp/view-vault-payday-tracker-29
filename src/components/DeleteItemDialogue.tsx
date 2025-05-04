import React from 'react';
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
import { Button } from "@/components/ui/button";
import { Trash } from 'lucide-react';
import { ContentItem } from '@/types';

interface DeleteItemDialogProps {
  item?: Pick<ContentItem, 'id' | 'title'> | null; 
  onConfirm: (itemId: string) => void;
}

const DeleteItemDialog: React.FC<DeleteItemDialogProps> = ({ item, onConfirm }) => {
  if (!item) {
    // Render just the button without dialog functionality if item is undefined/null
    return (
      <Button
        variant="ghost"
        size="icon"
        title="Delete Item (Disabled)"
        className="h-7 w-7 opacity-50" 
        disabled
      >
        <Trash className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    );
  }

  const handleDelete = () => {
    onConfirm(item.id);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
         <Button
           variant="ghost"
           size="icon"
           title="Delete Item"
           className="h-7 w-7" 
         >
           <Trash className="h-3.5 w-3.5 text-destructive" />
         </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the content item
            <span className="font-medium"> "{item.title || 'Untitled'}"</span>
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteItemDialog;
