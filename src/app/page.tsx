"use client";

import * as React from "react";
import { TreeView, TreeViewItem } from "@/components/tree-view";
import { Button } from "@/components/ui/button";

const sampleData: TreeViewItem[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    children: [
      {
        id: "1.1",
        name: "Work",
        type: "folder",
        children: [
          {
            id: "1.1.1",
            name: "Project A",
            type: "folder",
            children: [
              { id: "1.1.1.1", name: "report.pdf", type: "file" },
              { id: "1.1.1.2", name: "presentation.pptx", type: "file" },
            ],
          },
        ],
      },
      {
        id: "1.2",
        name: "Personal",
        type: "folder",
        children: [
          { id: "1.2.1", name: "resume.pdf", type: "file" },
          { id: "1.2.2", name: "photos", type: "folder", children: [] },
        ],
      },
    ],
  },
];

export default function Home() {
  const [selectedFile, setSelectedFile] = React.useState<TreeViewItem | null>(
    null
  );

  const handleSelectionChange = (item: TreeViewItem | null) => {
    setSelectedFile(item);
  };

  const handleAction = () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }
    alert(`Selected file: ${selectedFile.name}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-8">Tree View Demo</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <TreeView
            data={sampleData}
            onSelectionChange={handleSelectionChange}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {selectedFile ? "1 file selected" : "No file selected"}
            </span>
            <Button onClick={handleAction} disabled={!selectedFile}>
              Show Selected File
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
