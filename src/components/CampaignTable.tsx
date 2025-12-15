"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  companyDomain: string | null;
  title: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  enrichedBy: string | null;
  emailVerified: boolean | null;
  emailVerificationStatus: string | null;
  status: string | null;
}

interface CampaignData {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  enrichmentSource?: string;
}

interface CampaignInfo {
  id: string;
  name: string;
  url: string;
  status: string;
  progress?: {
    total: number;
    processed: number;
  };
}

interface CampaignTableProps {
  campaignId: string | null;
  onRefresh?: () => void;
}

export function CampaignTable({ campaignId, onRefresh }: CampaignTableProps) {
  const [data, setData] = useState<CampaignData[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCampaignData = useCallback(async (showLoading = true) => {
    if (!campaignId) return;

    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch campaign data");
      }
      const { campaign } = await response.json();
      const contactsCount = campaign.contacts?.length || 0;
      // Count contacts as processed if they have enrichment data (email, name, company, etc.)
      const completedContacts = campaign.contacts?.filter((c: Contact) => 
        c.status === 'completed' || 
        c.emailVerified || 
        (c.email && c.email !== 'N/A') ||
        (c.firstName || c.lastName) ||
        c.company
      ).length || 0;

      setCampaignInfo({
        id: campaign.id,
        name: campaign.name,
        url: campaign.url,
        status: campaign.status,
        progress: contactsCount > 0 ? {
          total: contactsCount,
          processed: completedContacts,
        } : undefined,
      });

      if (campaign.contacts && Array.isArray(campaign.contacts)) {
        setContacts(campaign.contacts);

        const contactsData: CampaignData[] = campaign.contacts.map((contact: Contact) => ({
          id: contact.id,
          name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A',
          email: contact.email || 'N/A',
          company: contact.company || 'N/A',
          status: contact.status || 'pending',
          enrichmentSource: contact.enrichedBy || undefined,
        }));
        setData(contactsData);
      } else {
        setContacts([]);
        setData([]);
      }
    } catch (error) {
      console.error("Error loading campaign data:", error);
      setData([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    } else {
      setData([]);
      setContacts([]);
      setCampaignInfo(null);
    }
  }, [campaignId, loadCampaignData]);

  useEffect(() => {
    if (!campaignId || !campaignInfo) {
      return;
    }

    const status = campaignInfo.status;
    const progress = campaignInfo.progress;
    const shouldPoll = status === 'processing' || 
                       (progress && 
                        progress.total > 0 &&
                        progress.processed < progress.total);

    if (!shouldPoll) {
      return;
    }

    const interval = setInterval(() => {
      loadCampaignData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [campaignId, campaignInfo, loadCampaignData]);

  const getAvailableColumns = useCallback(() => {
    if (contacts.length === 0) return [];

    const columnMap: Record<string, { label: string; key: keyof Contact }> = {
      name: { label: 'Name', key: 'firstName' },
      email: { label: 'Email', key: 'email' },
      title: { label: 'Title', key: 'title' },
      company: { label: 'Company', key: 'company' },
      companyDomain: { label: 'Company Domain', key: 'companyDomain' },
      phone: { label: 'Phone', key: 'phone' },
      linkedinUrl: { label: 'LinkedIn', key: 'linkedinUrl' },
      city: { label: 'City', key: 'city' },
      state: { label: 'State', key: 'state' },
      country: { label: 'Country', key: 'country' },
      status: { label: 'Status', key: 'status' },
      enrichedBy: { label: 'Source', key: 'enrichedBy' },
      emailVerified: { label: 'Email Verified', key: 'emailVerified' },
      emailVerificationStatus: { label: 'Verification Status', key: 'emailVerificationStatus' },
    };

    const availableColumns = Object.entries(columnMap).filter(([_, config]) => {
      return contacts.some(contact => {
        const value = contact[config.key];
        return value !== null && value !== undefined && value !== '';
      });
    });

    const alwaysInclude = ['name', 'email'];
    const included = new Set(availableColumns.map(([key]) => key));
    alwaysInclude.forEach(key => {
      if (!included.has(key) && columnMap[key]) {
        availableColumns.unshift([key, columnMap[key]]);
      }
    });

    return availableColumns.map(([key, config]) => ({ key, ...config }));
  }, [contacts]);


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

  const progressPercentage = campaignInfo?.progress && campaignInfo.progress.total > 0
    ? Math.round((campaignInfo.progress.processed / campaignInfo.progress.total) * 100)
    : 0;

  const showProgressBar = campaignInfo?.status === "processing" && 
                          campaignInfo?.progress && 
                          campaignInfo.progress.total > 0;

  const isComplete = campaignInfo?.status === 'completed' || 
                     (campaignInfo?.progress && 
                      campaignInfo.progress.total > 0 &&
                      campaignInfo.progress.processed >= campaignInfo.progress.total);

  const shouldShowTable = data.length > 0;

  const availableColumns = shouldShowTable ? getAvailableColumns() : [];

  const getCellValue = (contact: Contact, columnKey: string): string | React.ReactNode => {
    if (columnKey === 'name') {
      return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A';
    }
    
    if (columnKey === 'status') {
      const status = contact.status || 'pending';
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            status === "Active" || status === "completed"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          )}>
          {status}
        </span>
      );
    }

    if (columnKey === 'emailVerified') {
      return contact.emailVerified ? 'Yes' : 'No';
    }

    const value = contact[columnKey as keyof Contact];
    return value !== null && value !== undefined && value !== '' ? String(value) : 'N/A';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {showProgressBar && campaignInfo?.progress ? (
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="w-full max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Enriching contacts...
                </p>
                <p className="text-sm text-muted-foreground">
                  {campaignInfo.progress.processed} / {campaignInfo.progress.total}
                </p>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
            </div>
          </div>
        </div>
      ) : null}
      
      {shouldShowTable ? (
        <div className="flex-1 flex flex-col overflow-hidden max-w-full">
          <div className="flex-1 overflow-x-scroll">
            <div className="p-4">
              <div
                className="overflow-x-auto max-w-[800px] h-[65vh] mx-auto"
                style={
                  {
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
                  } as React.CSSProperties
                }>
                <table className="">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-border">
                      {availableColumns.map((column) => (
                        <th
                          key={column.key}
                          className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-border/50 hover:bg-muted/20">
                        {availableColumns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              "px-3 py-2.5 text-sm whitespace-nowrap",
                              column.key === 'status' || column.key === 'enrichedBy'
                                ? ""
                                : "text-foreground",
                              column.key === 'enrichedBy' && "text-muted-foreground"
                            )}
                          >
                            {getCellValue(contact, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : !showProgressBar ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              {campaignInfo?.status === "pending"
                ? "Campaign is pending. Enrichment will start automatically."
                : campaignInfo?.status === "processing"
                  ? "Enrichment in progress..."
                  : "No data available"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
