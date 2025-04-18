"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Folder, File, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TreeViewItem {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: TreeViewItem[];
}

interface TreeViewProps {
  data: TreeViewItem[];
  className?: string;
  searchPlaceholder?: string;
  onSelectionChange?: (selectedItem: TreeViewItem | null) => void;
}

export function TreeView({
  data,
  className,
  searchPlaceholder = "Search...",
  onSelectionChange,
}: TreeViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null
  );
  const [focusedItemId, setFocusedItemId] = React.useState<string | null>(null);
  const treeRef = React.useRef<HTMLDivElement>(null);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;

    setExpandedItems(new Set());

    const filterItems = (items: TreeViewItem[]): TreeViewItem[] => {
      return items
        .filter((item) => {
          const matches = item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const children = item.children ? filterItems(item.children) : [];

          if (matches || children.length > 0) {
            if (item.type === "folder" && (matches || children.length > 0)) {
              setExpandedItems((prev) => new Set([...prev, item.id]));
            }
            return true;
          }
          return false;
        })
        .map((item) => ({
          ...item,
          children: item.children?.length
            ? filterItems(item.children)
            : undefined,
        }));
    };

    return filterItems(data);
  }, [data, searchQuery]);

  // Flatten tree for keyboard navigation
  const flattenedItems = React.useMemo(() => {
    const items: TreeViewItem[] = [];
    const flatten = (item: TreeViewItem) => {
      items.push(item);
      if (item.children && expandedItems.has(item.id)) {
        item.children.forEach(flatten);
      }
    };
    filteredData.forEach(flatten);
    return items;
  }, [filteredData, expandedItems]);

  const handleSelectionChange = (item: TreeViewItem) => {
    const newSelectedId = item.id === selectedItemId ? null : item.id;
    setSelectedItemId(newSelectedId);
    if (onSelectionChange) {
      onSelectionChange(newSelectedId ? item : null);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && flattenedItems.length > 0) {
      e.preventDefault();
      setFocusedItemId(flattenedItems[0].id);
    }
  };

  const handleTreeKeyDown = (e: React.KeyboardEvent, item: TreeViewItem) => {
    const currentIndex = flattenedItems.findIndex((i) => i.id === item.id);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (currentIndex < flattenedItems.length - 1) {
          setFocusedItemId(flattenedItems[currentIndex + 1].id);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (currentIndex > 0) {
          setFocusedItemId(flattenedItems[currentIndex - 1].id);
        } else {
          // Focus search input when pressing up from first item
          const searchInput = treeRef.current?.querySelector("input");
          if (searchInput) {
            searchInput.focus();
            setFocusedItemId(null);
          }
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        if (item.type === "folder" && item.children?.length) {
          setExpandedItems((prev) => new Set([...prev, item.id]));
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (item.type === "folder" && expandedItems.has(item.id)) {
          setExpandedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (item.type === "file") {
          handleSelectionChange(item);
        } else if (item.children?.length) {
          setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (prev.has(item.id)) {
              newSet.delete(item.id);
            } else {
              newSet.add(item.id);
            }
            return newSet;
          });
        }
        break;
    }
  };

  return (
    <div ref={treeRef} className={cn("w-full max-w-md", className)} role="tree">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search files and folders"
        />
      </div>
      <div className="space-y-0.5">
        {filteredData.map((item) => (
          <TreeItem
            key={item.id}
            item={item}
            searchQuery={searchQuery}
            expandedItems={expandedItems}
            setExpandedItems={setExpandedItems}
            selectedItemId={selectedItemId}
            onSelect={handleSelectionChange}
            focusedItemId={focusedItemId}
            onKeyDown={handleTreeKeyDown}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeItemProps {
  item: TreeViewItem;
  searchQuery: string;
  expandedItems: Set<string>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedItemId: string | null;
  onSelect: (item: TreeViewItem) => void;
  focusedItemId: string | null;
  onKeyDown: (e: React.KeyboardEvent, item: TreeViewItem) => void;
}

function TreeItem({
  item,
  searchQuery,
  expandedItems,
  setExpandedItems,
  selectedItemId,
  onSelect,
  focusedItemId,
  onKeyDown,
}: TreeItemProps) {
  const isOpen = expandedItems.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = item.id === selectedItemId;
  const isFocused = item.id === focusedItemId;

  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isFocused]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        if (isOpen) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === "file") {
      onSelect(item);
    }
  };

  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="pl-4">
      <div
        ref={itemRef}
        role={item.type === "file" ? "treeitem" : "group"}
        aria-expanded={item.type === "folder" ? isOpen : undefined}
        aria-selected={item.type === "file" ? isSelected : undefined}
        tabIndex={isFocused ? 0 : -1}
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md outline-none transition-colors",
          (item.type === "file" || hasChildren) &&
            "hover:bg-gray-100 cursor-pointer",
          isFocused && "ring-2 ring-blue-500 bg-gray-50"
        )}
        onClick={item.type === "file" ? handleSelect : toggleExpand}
        onKeyDown={(e) => onKeyDown(e, item)}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4 flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </motion.div>
        ) : (
          <div className="w-4" />
        )}
        {item.type === "file" && (
          <div
            className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center bg-white"
            role="radio"
            aria-checked={isSelected}
          >
            {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          </div>
        )}
        {item.type === "folder" ? (
          <Folder className="h-4 w-4 text-blue-500" />
        ) : (
          <File className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-sm">{highlightMatch(item.name)}</span>
      </div>
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="group"
          >
            {item.children?.map((child) => (
              <TreeItem
                key={child.id}
                item={child}
                searchQuery={searchQuery}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
                selectedItemId={selectedItemId}
                onSelect={onSelect}
                focusedItemId={focusedItemId}
                onKeyDown={onKeyDown}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
