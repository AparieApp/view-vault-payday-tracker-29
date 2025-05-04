import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardSummary from "@/components/DashboardSummary";
import ActiveTrackingList from "@/components/ActiveTrackingList";
import FinalizeViewsList from "@/components/FinalizeViewsList";
import PaymentSettingsList from "@/components/PaymentSettingsList";
import PayoutManager from "@/components/PayoutManager";

const Dashboard: React.FC = () => {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Social Media View Tracker</h1>
          <p className="text-muted-foreground mb-6">Manually track views & calculate payments</p>
        </div>
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tracking">Active Tracking</TabsTrigger>
            <TabsTrigger value="finalize">Finalize Views</TabsTrigger>
            <TabsTrigger value="settings">Payment Settings</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardSummary />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <ActiveTrackingList />
          </TabsContent>

          <TabsContent value="finalize" className="space-y-6">
            <FinalizeViewsList />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PaymentSettingsList />
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <PayoutManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
