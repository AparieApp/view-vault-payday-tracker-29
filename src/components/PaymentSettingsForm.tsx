
import React, { useState, useEffect } from 'react';
import { useTracker } from '@/contexts/TrackerContext';
import { PaymentSettings, BonusThreshold } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PaymentSettingsFormProps {
  editingId?: string;
  onClose: () => void;
}

const PaymentSettingsForm: React.FC<PaymentSettingsFormProps> = ({ editingId, onClose }) => {
  const { state, addPaymentSetting, updatePaymentSetting } = useTracker();
  
  const [name, setName] = useState('');
  const [basePay, setBasePay] = useState(0);
  const [viewRate, setViewRate] = useState(0);
  const [viewsPerUnit, setViewsPerUnit] = useState(1000);
  const [trackingPeriodDays, setTrackingPeriodDays] = useState(30);
  const [maxPayout, setMaxPayout] = useState<number | undefined>(undefined);
  const [combineViews, setCombineViews] = useState(false);
  const [bonusThresholds, setBonusThresholds] = useState<BonusThreshold[]>([]);

  // Load existing settings if editing
  useEffect(() => {
    if (editingId) {
      const existingSettings = state.paymentSettings.find(setting => setting.id === editingId);
      if (existingSettings) {
        setName(existingSettings.name || '');
        setBasePay(existingSettings.basePay);
        setViewRate(existingSettings.viewRate);
        setViewsPerUnit(existingSettings.viewsPerUnit);
        setTrackingPeriodDays(existingSettings.trackingPeriodDays);
        setMaxPayout(existingSettings.maxPayout);
        setCombineViews(existingSettings.combineViews);
        setBonusThresholds([...existingSettings.bonusThresholds]);
      }
    }
  }, [editingId, state.paymentSettings]);

  const handleAddBonusThreshold = () => {
    setBonusThresholds([
      ...bonusThresholds,
      { threshold: 0, amount: 0 }
    ]);
  };

  const handleRemoveBonusThreshold = (index: number) => {
    const newThresholds = [...bonusThresholds];
    newThresholds.splice(index, 1);
    setBonusThresholds(newThresholds);
  };

  const handleUpdateBonusThreshold = (index: number, field: 'threshold' | 'amount', value: number) => {
    const newThresholds = [...bonusThresholds];
    newThresholds[index][field] = value;
    setBonusThresholds(newThresholds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const settingsData: PaymentSettings = {
      id: editingId || uuidv4(),
      name,
      basePay,
      viewRate,
      viewsPerUnit,
      trackingPeriodDays,
      maxPayout: maxPayout || undefined,
      bonusThresholds,
      combineViews
    };
    
    if (editingId) {
      updatePaymentSetting(settingsData);
    } else {
      addPaymentSetting(settingsData);
    }
    
    onClose();
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{editingId ? 'Edit Payment Settings' : 'Add Payment Settings'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Standard Rate" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePay">Base Pay ($)</Label>
              <Input 
                id="basePay" 
                type="number" 
                min="0" 
                step="0.01" 
                value={basePay} 
                onChange={(e) => setBasePay(parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingPeriod">Tracking Period (days)</Label>
              <Input 
                id="trackingPeriod" 
                type="number" 
                min="1" 
                value={trackingPeriodDays} 
                onChange={(e) => setTrackingPeriodDays(parseInt(e.target.value) || 30)} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="viewRate">Rate per Views ($)</Label>
              <Input 
                id="viewRate" 
                type="number" 
                min="0" 
                step="0.01" 
                value={viewRate} 
                onChange={(e) => setViewRate(parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="viewsPerUnit">Views per Unit</Label>
              <Input 
                id="viewsPerUnit" 
                type="number" 
                min="1" 
                value={viewsPerUnit} 
                onChange={(e) => setViewsPerUnit(parseInt(e.target.value) || 1000)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPayout">Maximum Payout ($ - optional)</Label>
            <Input 
              id="maxPayout" 
              type="number" 
              min="0" 
              step="0.01" 
              value={maxPayout === undefined ? '' : maxPayout} 
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                setMaxPayout(value);
              }} 
              placeholder="No maximum" 
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              checked={combineViews} 
              onCheckedChange={setCombineViews}
              id="combineViews"
            />
            <Label htmlFor="combineViews">Combine views across all content</Label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Bonus Thresholds</Label>
              <Button 
                type="button" 
                size="sm" 
                variant="outline"
                onClick={handleAddBonusThreshold}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Bonus
              </Button>
            </div>

            {bonusThresholds.length === 0 && (
              <p className="text-sm text-muted-foreground">No bonus thresholds set</p>
            )}

            {bonusThresholds.map((threshold, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Views threshold"
                  value={threshold.threshold}
                  onChange={(e) => handleUpdateBonusThreshold(index, 'threshold', parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-muted-foreground">views =</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bonus amount"
                  value={threshold.amount}
                  onChange={(e) => handleUpdateBonusThreshold(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRemoveBonusThreshold(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {editingId ? 'Update Settings' : 'Add Settings'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PaymentSettingsForm;
