
import React from "react";
import { TrackerProvider } from "@/contexts/TrackerContext";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  return (
    <TrackerProvider>
      <div className="min-h-screen bg-background">
        <Dashboard />
      </div>
    </TrackerProvider>
  );
};

export default Index;
