"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignData {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
}

interface CampaignTableProps {
  campaignId: string | null;
}

export function CampaignTable({ campaignId }: CampaignTableProps) {
  const [data, setData] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    } else {
      setData([]);
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    if (!campaignId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch campaign data");
      }
      const { campaign } = await response.json();

      // Parse the data field (it's stored as JSON)
      if (campaign.data && Array.isArray(campaign.data)) {
        setData(campaign.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error loading campaign data:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaignId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No campaign selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a campaign from the sidebar to view its data
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table - Simple ChatGPT style with scrollbar */}
      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="p-4">
            {/* Scrollable container for table */}
            <div
              className="w-full sm:w-2/3 mx-auto overflow-x-auto"
              style={
                {
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
                } as React.CSSProperties
              }>
              <div className="min-w-full inline-block align-middle">
                <table className="w-full min-w-[600px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Company
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                          {row.id}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                          {row.email}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                          {row.company}
                        </td>
                        <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                              row.status === "Active"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                            )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
