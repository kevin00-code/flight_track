import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIChatBoxProps = {

  messages: Message[];

  onSendMessage: (content: string) => void;

  isLoading?: boolean;

  placeholder?: string;

  className?: string;

  height?: string | number;

  emptyStateMessage?: string;

  suggestedPrompts?: string[];
};

export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayMessages = messages.filter((msg) => msg.role !== "system");
  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;
      const userMessageReservedHeight = 56;
      const calculatedHeight = scrollAreaHeight - 32 - userMessageReservedHeight;

      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []);
const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement;

    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInput("");
    scrollToBottom();

    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm",
        className
      )}
      style={{ height }}
    >
      {}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="size-12 opacity-20" />
                <p className="text-sm">{emptyStateMessage}</p>
              </div>

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col space-y-4 p-4">
              {displayMessages.map((message, index) => {
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight =
                  isLastMessage && !isLoading && minHeightForLastMessage > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user"
                        ? "justify-end items-start"
                        : "justify-start items-start"
                    )}
                    style={
                      shouldApplyMinHeight
                        ? { minHeight: `${minHeightForLastMessage}px` }
                        : undefined
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2.5",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                        <User className="size-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div
                  className="flex items-start gap-3"
                  style={
                    minHeightForLastMessage > 0
                      ? { minHeight: `${minHeightForLastMessage}px` }
                      : undefined
                  }
                >
                  <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2.5">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t bg-background/50 items-end"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 max-h-32 resize-none min-h-9"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="shrink-0 h-[38px] w-[38px]"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[280px] border-r border-border bg-background p-4 space-y-6">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Menu items */}
        <div className="space-y-2 px-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 p-4 space-y-4">
        {}
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
import { useState, useMemo } from "react";
import { Flight } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";

interface FlightListProps {
  flights: Flight[];
  selectedFlightId?: string;
  onFlightSelect?: (flight: Flight) => void;
  isLoading?: boolean;
}

type SortField = "callsign" | "baroAltitude" | "velocity" | "originCountry";
type SortOrder = "asc" | "desc";

export default function FlightList({
  flights,
  selectedFlightId,
  onFlightSelect,
  isLoading,
}: FlightListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("callsign");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const query = searchQuery.toLowerCase();
      return (
        flight.callsign?.toLowerCase().includes(query) ||
        flight.originCountry?.toLowerCase().includes(query) ||
        flight.icao24.toLowerCase().includes(query)
      );
    });
  }, [flights, searchQuery]);

  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    sorted.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "callsign") {
        aVal = a.callsign || "";
        bVal = b.callsign || "";
      } else if (sortField === "baroAltitude") {
        aVal = a.baroAltitude ? parseFloat(a.baroAltitude) : 0;
        bVal = b.baroAltitude ? parseFloat(b.baroAltitude) : 0;
      } else if (sortField === "velocity") {
        aVal = a.velocity ? parseFloat(a.velocity) : 0;
        bVal = b.velocity ? parseFloat(b.velocity) : 0;
      } else if (sortField === "originCountry") {
        aVal = a.originCountry || "";
        bVal = b.originCountry || "";
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredFlights, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by callsign, country, or ICAO24..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {}
      <div className="text-sm text-muted-foreground">
        {sortedFlights.length} flight{sortedFlights.length !== 1 ? "s" : ""} found
      </div>

      {}
      <div className="flex-1 overflow-auto border border-border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading flights...</div>
          </div>
        ) : sortedFlights.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">
              {flights.length === 0 ? "No flights in Kenyan airspace" : "No matching flights"}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead className="w-24">
                  <button
                    onClick={() => toggleSort("callsign")}
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    Callsign
                    <SortIcon field="callsign" />
                  </button>
                </TableHead>
                <TableHead className="w-20">
                  <button
                    onClick={() => toggleSort("baroAltitude")}
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    Altitude
                    <SortIcon field="baroAltitude" />
                  </button>
                </TableHead>
                <TableHead className="w-20">
                  <button
                    onClick={() => toggleSort("velocity")}
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    Speed
                    <SortIcon field="velocity" />
                  </button>
                </TableHead>
                <TableHead className="w-24">
                  <button
                    onClick={() => toggleSort("originCountry")}
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    Country
                    <SortIcon field="originCountry" />
                  </button>
                </TableHead>
                <TableHead className="w-16">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFlights.map((flight) => (
                <TableRow
                  key={flight.icao24}
                  onClick={() => onFlightSelect?.(flight)}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedFlightId === flight.icao24 ? "bg-muted" : ""
                  }`}
                >
                  <TableCell className="font-mono font-semibold">
                    {flight.callsign || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {flight.baroAltitude ? Math.round(parseFloat(flight.baroAltitude)).toLocaleString() : "N/A"} m
                  </TableCell>
                  <TableCell className="text-sm">
                    {flight.velocity ? Math.round(parseFloat(flight.velocity) * 1.944) : "N/A"} kt
                  </TableCell>
                  <TableCell className="text-sm">{flight.originCountry || "Unknown"}</TableCell>
                  <TableCell className="text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flight.onGround
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {flight.onGround ? "Ground" : "Airborne"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Flight, Airport } from "@/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";

interface FlightTrackerProps {
  flights: Flight[];
  airports: Airport[];
  isLoading?: boolean;
}

// Kenya bounding box
const KENYA_BOUNDS = {
  north: 5.5,
  south: -4.7,
  east: 41.9,
  west: 33.9,
};

type SortField = "callsign" | "baroAltitude" | "velocity" | "originCountry";
type SortOrder = "asc" | "desc";

const createAircraftIcon = (heading: number = 0) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${heading}deg); font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">✈️</div>`,
    iconSize: [24, 24],
    className: "aircraft-icon",
  });
};

const createAirportIcon = () => {
  return L.icon({
    iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'%3E%3Ccircle cx='12' cy='12' r='10' fill='%232563eb'/%3E%3Cpath d='M12 8v8M8 12h8' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
    iconSize: [28, 28],
    popupAnchor: [0, -14],
  });
};

export default function FlightTracker({
  flights,
  airports,
  isLoading,
}: FlightTrackerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const flightMarkers = useRef<Map<string, L.Marker>>(new Map());
  const airportMarkers = useRef<Map<string, L.Marker>>(new Map());

  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("callsign");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView(
      [(KENYA_BOUNDS.north + KENYA_BOUNDS.south) / 2, (KENYA_BOUNDS.east + KENYA_BOUNDS.west) / 2],
      6
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Add Kenya bounds rectangle
    L.rectangle(
      [
        [KENYA_BOUNDS.south, KENYA_BOUNDS.west],
        [KENYA_BOUNDS.north, KENYA_BOUNDS.east],
      ],
      {
        color: "#3B82F6",
        weight: 2,
        opacity: 0.2,
        fill: true,
        fillColor: "#3B82F6",
        fillOpacity: 0.05,
      }
    ).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    airportMarkers.current.forEach((marker) => marker.remove());
    airportMarkers.current.clear();

    airports.forEach((airport) => {
      const lat = parseFloat(airport.latitude);
      const lon = parseFloat(airport.longitude);

      const marker = L.marker([lat, lon], { icon: createAirportIcon() })
        .bindPopup(
          `<div class="font-semibold text-blue-600">${airport.name}</div>
           <div class="text-sm text-gray-600">${airport.iataCode} (${airport.icaoCode})</div>
           <div class="text-xs text-gray-500">${airport.city}</div>`
        )
        .addTo(map.current!);

      airportMarkers.current.set(airport.icaoCode, marker);
    });
  }, [airports]);

  useEffect(() => {
    if (!map.current) return;

    const currentFlightIds = new Set(flights.map((f) => f.icao24));
    flightMarkers.current.forEach((marker, icao24) => {
      if (!currentFlightIds.has(icao24)) {
        marker.remove();
        flightMarkers.current.delete(icao24);
      }
    });

    flights.forEach((flight) => {
      if (!flight.latitude || !flight.longitude) return;

      const lat = parseFloat(flight.latitude);
      const lon = parseFloat(flight.longitude);
      const heading = flight.trueTrack ? parseFloat(flight.trueTrack) : 0;
      const isSelected = flight.icao24 === selectedFlight?.icao24;

      const existingMarker = flightMarkers.current.get(flight.icao24);

      if (existingMarker) {
        existingMarker.setLatLng([lat, lon]);
        existingMarker.setIcon(createAircraftIcon(heading));
        existingMarker.setOpacity(isSelected ? 1 : 0.7);
      } else {
        const marker = L.marker([lat, lon], { icon: createAircraftIcon(heading) })
          .bindPopup(
            `<div class="font-bold text-blue-600">${flight.callsign || "Unknown"}</div>
             <div class="text-sm">Altitude: ${flight.baroAltitude ? Math.round(parseFloat(flight.baroAltitude)) : "N/A"} m</div>
             <div class="text-sm">Speed: ${flight.velocity ? Math.round(parseFloat(flight.velocity) * 1.944) : "N/A"} kt</div>
             <div class="text-xs text-gray-600">${flight.originCountry}</div>`
          )
          .on("click", () => {
            setSelectedFlight(flight);
            setIsDetailOpen(true);
          })
          .addTo(map.current!);

        flightMarkers.current.set(flight.icao24, marker);
      }
    });
  }, [flights, selectedFlight]);

  const uniqueFlights = Array.from(
    new Map(
      flights.map((flight) => [flight.icao24, flight])
    ).values()
  );

const flightPath = new google.maps.Polyline({
  path: historicalCoords,
  geodesic: true,
  strokeColor: "#FF0000",
  strokeOpacity: 1.0,
  strokeWeight: 2,
});
flightPath.setMap(map.current);

  const filteredFlights = uniqueFlights.filter((flight) => {
    const query = searchQuery.toLowerCase();
    return (
      flight.callsign?.toLowerCase().includes(query) ||
      flight.originCountry?.toLowerCase().includes(query) ||
      flight.icao24.toLowerCase().includes(query)
    );
  });

  // Sort flights
  const sortedFlights = [...filteredFlights].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortField === "callsign") {
      aVal = a.callsign || "";
      bVal = b.callsign || "";
    } else if (sortField === "baroAltitude") {
      aVal = a.baroAltitude ? parseFloat(a.baroAltitude) : 0;
      bVal = b.baroAltitude ? parseFloat(b.baroAltitude) : 0;
    } else if (sortField === "velocity") {
      aVal = a.velocity ? parseFloat(a.velocity) : 0;
      bVal = b.velocity ? parseFloat(b.velocity) : 0;
    } else if (sortField === "originCountry") {
      aVal = a.originCountry || "";
      bVal = b.originCountry || "";
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const formatAltitude = (alt: string | null) => {
    if (!alt) return "N/A";
    return `${Math.round(parseFloat(alt)).toLocaleString()} m`;
  };

  const formatVelocity = (vel: string | null) => {
    if (!vel) return "N/A";
    return `${Math.round(parseFloat(vel) * 1.944)} kt`;
  };

  const formatVerticalRate = (rate: string | null) => {
    if (!rate) return "N/A";
    const rateMs = parseFloat(rate);
    return `${Math.round(rateMs * 196.85)} ft/min`;
  };

  const formatTrack = (track: string | null) => {
    if (!track) return "N/A";
    const trackDeg = parseFloat(track);
    let direction = "N";
    if (trackDeg >= 22.5 && trackDeg < 67.5) direction = "NE";
    else if (trackDeg >= 67.5 && trackDeg < 112.5) direction = "E";
    else if (trackDeg >= 112.5 && trackDeg < 157.5) direction = "SE";
    else if (trackDeg >= 157.5 && trackDeg < 202.5) direction = "S";
    else if (trackDeg >= 202.5 && trackDeg < 247.5) direction = "SW";
    else if (trackDeg >= 247.5 && trackDeg < 292.5) direction = "W";
    else if (trackDeg >= 292.5 && trackDeg < 337.5) direction = "NW";

    return `${Math.round(trackDeg)}° (${direction})`;
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Map */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-muted-foreground">Loading map...</div>
            </div>
          ) : (
            <div ref={mapContainer} className="w-full h-full rounded-2xl" />
          )}
        </div>

        {}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-md border border-blue-100 dark:border-blue-900/30 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-muted-foreground">Active Flights:</span>
                <span className="ml-1 font-bold text-blue-600 dark:text-blue-400 text-lg">{flights.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-muted-foreground">Airports:</span>
                <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-400 text-lg">{airports.length}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30 p-5 flex flex-col overflow-hidden hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">Active Flights</h2>

        {}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
          <Input
            placeholder="Search by callsign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-900/30 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {}
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
          {sortedFlights.length} flight{sortedFlights.length !== 1 ? "s" : ""} found
        </div>

        {}
        <div className="flex-1 overflow-auto border border-blue-100 dark:border-blue-900/30 rounded-xl bg-gradient-to-b from-blue-50/50 to-transparent dark:from-slate-800/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading flights...</div>
            </div>
          ) : sortedFlights.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">
                {flights.length === 0 ? "No flights in Kenyan airspace" : "No matching flights"}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-200 dark:border-blue-900/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24">
                    <button
                      onClick={() => toggleSort("callsign")}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-foreground transition-colors"
                    >
                      Callsign
                      <SortIcon field="callsign" />
                    </button>
                  </TableHead>
                  <TableHead className="w-20">
                    <button
                      onClick={() => toggleSort("baroAltitude")}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-foreground transition-colors"
                    >
                      Altitude
                      <SortIcon field="baroAltitude" />
                    </button>
                  </TableHead>
                  <TableHead className="w-20">
                    <button
                      onClick={() => toggleSort("velocity")}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-foreground transition-colors"
                    >
                      Speed
                      <SortIcon field="velocity" />
                    </button>
                  </TableHead>
                  <TableHead className="w-24">
                    <button
                      onClick={() => toggleSort("originCountry")}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-foreground transition-colors"
                    >
                      Country
                      <SortIcon field="originCountry" />
                    </button>
                  </TableHead>
                  <TableHead className="w-16 font-bold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFlights.map((flight, index) => (
                  <TableRow
                    key={`${flight.icao24}-${index}`}
                    onClick={() => {
                      setSelectedFlight(flight);
                      setIsDetailOpen(true);
                    }}
                    className={`cursor-pointer transition-all duration-200 border-b border-blue-100 dark:border-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                      selectedFlight?.icao24 === flight.icao24 ? "bg-blue-100 dark:bg-blue-900/30" : ""
                    }`}
                  >
                    <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {flight.callsign || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {flight.baroAltitude ? Math.round(parseFloat(flight.baroAltitude)).toLocaleString() : "N/A"} m
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {flight.velocity ? Math.round(parseFloat(flight.velocity) * 1.944) : "N/A"} kt
                    </TableCell>
                    <TableCell className="text-sm font-medium">{flight.originCountry || "Unknown"}</TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          flight.onGround
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        }`}
                      >
                        {flight.onGround ? "Ground" : "Airborne"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl">
                  {selectedFlight?.callsign || "Unknown Flight"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  ICAO24: {selectedFlight?.icao24}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>

          {selectedFlight && (
            <div className="space-y-6">
              {}
              <div className="flex items-center gap-4">
                <Badge
                  variant={selectedFlight.onGround ? "secondary" : "default"}
                  className="text-base px-3 py-1"
                >
                  {selectedFlight.onGround ? "On Ground" : "Airborne"}
                </Badge>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {selectedFlight.originCountry || "Unknown"}
                </Badge>
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Position</h3>
                  <p className="text-lg font-mono">
                    {selectedFlight.latitude && selectedFlight.longitude
                      ? `${parseFloat(selectedFlight.latitude).toFixed(4)}°, ${parseFloat(selectedFlight.longitude).toFixed(4)}°`
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Altitude</h3>
                  <p className="text-lg font-mono">{formatAltitude(selectedFlight.baroAltitude)}</p>
                </div>
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Velocity</h3>
                  <p className="text-lg font-mono">{formatVelocity(selectedFlight.velocity)}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Track</h3>
                  <p className="text-lg font-mono">{formatTrack(selectedFlight.trueTrack)}</p>
                </div>
              </div>

              {}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Vertical Rate</h3>
                <p className="text-lg font-mono">{formatVerticalRate(selectedFlight.verticalRate)}</p>
              </div>

              {}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Aircraft Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{selectedFlight.aircraftCategory || "Unknown"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Squawk</p>
                    <p className="text-sm font-mono">{selectedFlight.squawk || "N/A"}</p>
                  </div>
                </div>
              </div>

              {}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Telemetry</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Position Source</p>
                    <p className="font-medium">
                      {selectedFlight.positionSource !== null
                        ? ["ADS-B", "ASTERIX", "MLAT", "FLARM"][selectedFlight.positionSource] || "Unknown"
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">SPI</p>
                    <p className="font-medium">{selectedFlight.spi ? "Yes" : "No"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Last Position Update</p>
                    <p className="font-mono text-xs">{formatTime(selectedFlight.timePosition)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Last Contact</p>
                    <p className="font-mono text-xs">{formatTime(selectedFlight.lastContact)}</p>
                  </div>
                </div>
              </div>

              {}
              {selectedFlight.geoAltitude && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Geometric Altitude</h3>
                  <p className="text-lg font-mono">{formatAltitude(selectedFlight.geoAltitude)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-5 bg-[#f8f8f7] rounded-[20px] w-[400px] shadow-[0px_4px_11px_0px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.08)] backdrop-blur-2xl p-0 gap-0 text-center">
        <div className="flex flex-col items-center gap-2 p-5 pt-12">
          {logo ? (
            <div className="w-16 h-16 bg-white rounded-xl border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
              <img
                src={logo}
                alt="Dialog graphic"
                className="w-10 h-10 rounded-md"
              />
            </div>
          ) : null}

          {}
          {title ? (
            <DialogTitle className="text-xl font-semibold text-[#34322d] leading-[26px] tracking-[-0.44px]">
              {title}
            </DialogTitle>
          ) : null}
          <DialogDescription className="text-sm text-[#858481] leading-5 tracking-[-0.154px]">
            Please login with Manus to continue
          </DialogDescription>
        </div>

        <DialogFooter className="px-5 py-5">
          {}
          <Button
            onClick={onLogin}
            className="w-full h-10 bg-[#1a1a19] hover:bg-[#1a1a19]/90 text-white rounded-[10px] text-sm font-medium leading-5 tracking-[-0.154px]"
          >
            Login with Manus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

<reference types="@types/google.maps" />

import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript() {
  return new Promise(resolve => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve(null);
      script.remove();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);
  });
  const weatherLayer = new google.maps.ImageMapType({
  getTileUrl: (coord, zoom) => {
    return `https://tile.openweathermap.org/map/precipitation_new/${zoom}/${coord.x}/${coord.y}.png?appid=YOUR_API_KEY`;
  },
  tileSize: new google.maps.Size(256, 256),
  opacity: 0.5,
});
map.current.overlayMapTypes.push(weatherLayer);
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);

  const init = usePersistFn(async () => {
    await loadMapScript();
    if (!mapContainer.current) {
      console.error("Map container not found");
      return;
    }
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      mapId: "DEMO_MAP_ID",
    });
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
