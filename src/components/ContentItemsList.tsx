
import React, { useState } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Edit, Trash, Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import PlatformIcon from './PlatformIcon';
import ContentItemForm from './ContentItemForm';

const ContentItemsList: React.FC = () => {
  const { state, deleteContentItem, calculateEarnings, calculatePendingEarnings } = useTracker();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined);

  const handleAddNew = () => {
    setEditingId(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteContentItem(deletingId);
      setDeletingId(undefined);
    }
  };

  // Function to get the name of a payment setting by ID
  const getSettingName = (id: string) => {
    const setting = state.paymentSettings.find(s => s.id === id);
    return setting ? setting.name : 'Unknown Setting';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Content Items</h2>
        <Button onClick={handleAddNew} disabled={state.paymentSettings.length === 0}>
          <Plus className="mr-1 h-4 w-4" /> Add New Content
        </Button>
      </div>

      {state.contentItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No content items added yet.</p>
              {state.paymentSettings.length > 0 ? (
                <Button variant="outline" className="mt-4" onClick={handleAddNew}>
                  <Plus className="mr-1 h-4 w-4" /> Add Your First Content Item
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  You need to create payment settings first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Payment Settings</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.contentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <PlatformIcon platform={item.platform} />
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                        {format(new Date(item.uploadDate), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(item.views)}</TableCell>
                    <TableCell>{getSettingName(item.paymentSettingsId)}</TableCell>
                    <TableCell>{formatCurrency(calculateEarnings(item))}</TableCell>
                    <TableCell>{formatCurrency(calculatePendingEarnings(item))}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingId(item.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog for adding/editing content items */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <ContentItemForm 
            editingId={editingId} 
            onClose={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Alert dialog for confirming deletion */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this content item and its payment history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContentItemsList;
