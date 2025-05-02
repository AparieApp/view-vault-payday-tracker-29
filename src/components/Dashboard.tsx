
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardSummary from './DashboardSummary';
import PaymentSettingsList from './PaymentSettingsList';
import ContentItemsList from './ContentItemsList';
import PayoutManager from './PayoutManager';

const Dashboard: React.FC = () => {
  return (
    <div className="container p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-vivid-purple">Creator Payment Tracker</h1>
      </div>
      
      <DashboardSummary />
      
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          <ContentItemsList />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <PaymentSettingsList />
        </TabsContent>
        
        <TabsContent value="payouts" className="space-y-4">
          <PayoutManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
