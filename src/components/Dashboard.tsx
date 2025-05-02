
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardSummary from "@/components/DashboardSummary";
import ContentItemsList from "@/components/ContentItemsList";
import PaymentSettingsList from "@/components/PaymentSettingsList";
import PayoutManager from "@/components/PayoutManager";
import ChannelManagement from "@/components/ChannelManagement";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Content Creator Payments</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 md:w-auto w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardSummary />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <ContentItemsList />
        </TabsContent>
        
        <TabsContent value="channels" className="space-y-6">
          <ChannelManagement />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <PaymentSettingsList />
        </TabsContent>
        
        <TabsContent value="payouts" className="space-y-6">
          <PayoutManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
