"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    label?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                    <div className="flex justify-center mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                    </div>
                    <h3 className="mb-1 text-sm font-bold text-red-400">
                        {this.props.label || "Something went wrong"}
                    </h3>
                    <p className="text-xs text-white/50">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
