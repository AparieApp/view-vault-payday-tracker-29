
import React, { useState } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/utils';
import { Edit, Trash, Plus } from 'lucide-react';
import PaymentSettingsForm from './PaymentSettingsForm';

const PaymentSettingsList: React.FC = () => {
  const { state, deletePaymentSetting } = useTracker();
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
      deletePaymentSetting(deletingId);
      setDeletingId(undefined);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Payment Settings</h2>
        <Button onClick={handleAddNew}>
          <Plus className="mr-1 h-4 w-4" /> Add New Setting
        </Button>
      </div>

      {state.paymentSettings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment settings defined yet.</p>
              <Button variant="outline" className="mt-4" onClick={handleAddNew}>
                <Plus className="mr-1 h-4 w-4" /> Add Your First Setting
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.paymentSettings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <CardTitle>{setting.name}</CardTitle>
                <CardDescription>
                  {setting.trackingPeriodDays} day tracking period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Pay:</span>
                    <span className="font-medium">{formatCurrency(setting.basePay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Views:</span>
                    <span className="font-medium">
                      {formatCurrency(setting.viewRate)} per {setting.viewsPerUnit.toLocaleString()} views
                    </span>
                  </div>
                  {setting.maxPayout && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Payout:</span>
                      <span className="font-medium">{formatCurrency(setting.maxPayout)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Combine Views:</span>
                    <span className="font-medium">{setting.combineViews ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bonuses:</span>
                    {setting.bonusThresholds.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {setting.bonusThresholds.map((bonus, index) => (
                          <li key={index} className="text-sm flex justify-between">
                            <span>{bonus.threshold.toLocaleString()} views:</span>
                            <span className="font-medium">{formatCurrency(bonus.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">None</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(setting.id)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeletingId(setting.id)}>
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for adding/editing settings */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <PaymentSettingsForm 
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
              This will permanently delete this payment setting. This action cannot be undone.
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

export default PaymentSettingsList;
