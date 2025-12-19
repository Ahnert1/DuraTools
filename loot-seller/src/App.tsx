import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { lootItems, ItemData } from './data/itemDataMultiNpc';
import { ExtendedItemData } from './models/ExtendedItemData';
import { handleImageError } from './utils/imageUtils';
import { CATEGORIES } from './enums/Categories';
import { HeaderCollage } from './components/HeaderCollage';
import { getCustomItems, deleteCustomItem } from './utils/local-storage';
import placeholderBase64 from './utils/placeholder-base64';
import { capitalize } from './utils/helpers';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './@/components/ui/tabs';
import { Textarea } from "./@/components/ui/textarea";
import { raidData } from './data/raidData';
import { ParsedRaid } from './models/ParsedRaid';
import MobCell from './components/MobCell';
import { mobData } from './data/mobData';
import { ItemCreateModal } from './components/item-create-modal';
import { RaidTooltip } from './components/RaidTooltip';
import { BeginnerCopyingTip } from './components/BeginnerCopyingTip';

function App() {
  // State for form fields
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<(ExtendedItemData) | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<(ExtendedItemData)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // State for table entries
  const [tableEntries, setTableEntries] = useState<(ExtendedItemData)[]>([]);
  const [isItemNameInputFocused, setIsItemNameInputFocused] = useState(false);
  const [lastUpdatedItemName, setLastUpdatedItemName] = useState<string | null>(null);
  const [isQuantityDecreasing, setIsQuantityDecreasing] = useState(false);
  const [lastTotalValue, setLastTotalValue] = useState<number>(0);
  // Refs for form elements
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const floatingValueIdRef = useRef(0);
  const bottomOfTable = useRef<HTMLDivElement>(null);
  //other state fields
  const [floatingValues, setFloatingValues] = useState<Array<{ id: number; value: number; isPositive: boolean }>>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [customItems, setCustomItems] = useState<ExtendedItemData[]>([])
  const [searchResultsKey, setSearchResultsKey] = useState(0);
  const [itemToEdit, setItemToEdit] = useState<ExtendedItemData | null>(null)
  // Add new state for active tab
  const [activeTab, setActiveTab] = useState("raids");
  // Add these state variables in the App component
  const [raidLogInput, setRaidLogInput] = useState('');
  const [parsedRaids, setParsedRaids] = useState<ParsedRaid[]>([]);
  const [raidViewMode, setRaidViewMode] = useState<'time' | 'location'>(() => {
    const savedMode = localStorage.getItem('raidViewMode');
    return (savedMode === 'time' || savedMode === 'location') ? savedMode : 'time';
  });
  const [unmatchedLines, setUnmatchedLines] = useState<{ line: string, elapsedTime: number }[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  // Sell-by-NPC filter + selection
  const [npcItemFilter, setNpcItemFilter] = useState('');
  const [showNpcItemSuggestions, setShowNpcItemSuggestions] = useState(false);
  const [selectedNpcItemFilter, setSelectedNpcItemFilter] = useState<null | { type: 'npc' | 'item'; value: string }>(null);
  const npcFilterContainerRef = useRef<HTMLDivElement>(null);
  const npcFilterInputRef = useRef<HTMLInputElement>(null);
  const [isNpcFilterFocused, setIsNpcFilterFocused] = useState(false);

  // Add new function to get random mob/item
  const getRandomMob = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * mobData.length);
    return mobData[randomIndex];
  }, []);

  const getRandomItem = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * lootItems.length);
    return lootItems[randomIndex];
  }, []);

  // Add state for random mob/item (will rotate periodically)
  const [randomMob, setRandomMob] = useState(getRandomMob);
  const [randomItem, setRandomItem] = useState(getRandomItem);

  // Rotate tab icons at a cadence similar to the crystal coin (8 frames ~ 800ms)
  useEffect(() => {
    const ICON_CYCLE_MS = 500;
    const intervalId = setInterval(() => {
      setRandomMob(prev => {
        const prevName = prev?.name;
        let next = getRandomMob();
        // try to avoid repeating the exact same mob consecutively
        for (let i = 0; i < 3 && next?.name === prevName; i++) {
          next = getRandomMob();
        }
        return next;
      });
      setRandomItem(prev => {
        const prevName = prev?.name;
        let next = getRandomItem();
        // try to avoid repeating the exact same item consecutively
        for (let i = 0; i < 3 && next?.name === prevName; i++) {
          next = getRandomItem();
        }
        return next;
      });
    }, ICON_CYCLE_MS);

    return () => clearInterval(intervalId);
  }, [getRandomMob, getRandomItem]);

  useEffect(() => {
    setCustomItems(getCustomItems())
  }, [])

  useEffect(() => {
    // Always use the latest customItems and lootItems
    let items = [...lootItems, ...customItems];
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    const fuse = new Fuse(items, { keys: ['name'], threshold: 0.3 });
    let results: ExtendedItemData[] = [];

    if (searchQuery.trim() === '') {
      results = items.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      results = fuse.search(searchQuery).map(result => result.item);
      // If no match, add a new custom item to the results
      const showCreate = searchQuery.trim() && results.every(r => r.name.toLowerCase() !== searchQuery.trim().toLowerCase());
      if (showCreate) {
        results.push({
          name: capitalize(searchQuery),
          value: 0,
          imageBase64: placeholderBase64,
          category: "New Custom",
          npcNames: ["+ New Custom Item"]
        });
      }
    }
    setSearchResults(results);
  }, [searchQuery, selectedCategory, customItems]);

  // Get filtered and sorted items
  const filteredItems = useMemo(() => {
    let items = [...lootItems, ...customItems];

    // Filter by category if needed
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Sort alphabetically by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCategory, customItems, searchResults]);

  // Calculate total value of all items
  const totalValue = useMemo(() => {
    const newTotal = tableEntries.reduce((sum, entry) => sum + entry.value, 0);
    if (newTotal !== lastTotalValue) {
      setLastTotalValue(newTotal);
    }
    return newTotal;
  }, [tableEntries, lastTotalValue]);

  const getDisplayValue = (value: number) => {
    if (value >= 1000000) return `${value / 1000000}kk`;
    if (value >= 1000) return `${value / 1000}k`;
    return value;
  }

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsItemNameInputFocused(true);
    setShowResults(true);
    if (!searchQuery.trim()) {
      setSearchResults(filteredItems); // Show all items from the category
    } else {
      handleSearchChange({ target: { value: searchQuery } } as React.ChangeEvent<HTMLInputElement>)
    }
  };

  // Handle key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed and we have search results
    if (e.key === 'Enter' && searchQuery.trim() !== '' && searchResults.length > 0 && showResults) {
      e.preventDefault(); // Prevent form submission
      // Select the first item in the results
      handleSelectItem(searchResults[0]);
      // Focus the quantity input after a short delay to ensure state updates
      setTimeout(() => {
        if (quantityInputRef.current) {
          quantityInputRef.current.focus();
          quantityInputRef.current.select();
        }
      }, 10);
    }
  };

  const handleDeleteKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Delete" && searchResults.length > 0 && searchResults[0].category === CATEGORIES.CUSTOM) {
      const newCustomItems = customItems.filter(item => item.name !== searchResults[0].name)
      setCustomItems(newCustomItems);
      handleDeleteItem(searchResults[0].name ?? '', true);
      handleSearchChange({ target: { value: searchQuery } } as React.ChangeEvent<HTMLInputElement>);
    }
  }

  const handleInsertKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Insert" && searchResults.length > 0 && searchResults[0].category === CATEGORIES.CUSTOM) {
      e.preventDefault();
      setItemToEdit(searchResults[0]);
      setIsCreateModalOpen(true);
      setShowResults(false);
    }
  }

  // Handle key press in quantity input
  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedItem) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.slice(0, 30);
    setSearchQuery(query);

    if (query !== selectedItem?.name) {
      setSelectedItem(null);
    }
  };

  // Handle selecting an item from search results
  const handleSelectItem = (item: ExtendedItemData) => {
    if (item.category === "New Custom" && !filteredItems.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
      setIsCreateModalOpen(true)
      setShowResults(false);
    } else {
      setSelectedItem(item);
      setSearchQuery(item.name);
      setShowResults(false);
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') { setQuantity(null); }
    else {
      // Remove leading zeroes
      const noLeadingZeroes = value.replace(/^0+/, '');
      // If the value is empty or just zeros, set to 0
      const numValue = noLeadingZeroes ? parseInt(noLeadingZeroes, 10) : 0;
      // Ensure the value is between 0 and 9999
      const finalValue = Math.max(0, Math.min(9999, numValue));
      // Update the input's value directly to remove leading zeroes
      e.target.value = finalValue.toString();
      setQuantity(finalValue);
    }
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    console.log("TesT")

    // Update search results based on new category
    if (!searchQuery.trim()) {
      // Find filtered items with the new category
      const newCategory = e.target.value;
      let newFilteredItems = [...filteredItems];

      if (newCategory !== 'All') {
        newFilteredItems = newFilteredItems.filter(item => item.category === newCategory);
      }

      // Sort alphabetically and show all matching items
      setSearchResults(
        newFilteredItems
          .sort((a, b) => a.name.localeCompare(b.name))
      );

    } else {
      // Rerun search with current query but new category
      handleSearchChange({ target: { value: searchQuery } } as React.ChangeEvent<HTMLInputElement>);
    }
    requestAnimationFrame(() => {
      itemNameInputRef.current?.focus();
    });
  };

  // Add this new function to handle floating value animations
  const addFloatingValue = (value: number, isPositive: boolean) => {
    const id = floatingValueIdRef.current++;
    setFloatingValues(prev => [...prev, { id, value, isPositive }]);

    // Remove the floating value after animation completes
    setTimeout(() => {
      setFloatingValues(prev => prev.filter(v => v.id !== id));
    }, 1500);
  };

  // Add item to table
  const handleAddItem = () => {
    if (!selectedItem) return;

    const quantityToAdd = quantity ?? 1;
    const existingEntryIndex = tableEntries.findIndex(entry => entry.name === selectedItem.name);
    const valueChange = selectedItem.value * quantityToAdd;

    if (existingEntryIndex !== -1) {
      // Item already exists, update its quantity and value
      const updatedEntries = tableEntries.map((entry, index) => {
        if (index === existingEntryIndex) {
          const newQuantity = (entry.quantity ?? 0) + quantityToAdd;
          const finalQuantity = Math.min(9999, newQuantity);
          return {
            ...entry,
            quantity: finalQuantity,
            value: selectedItem.value * finalQuantity,
          };
        }
        return entry;
      });
      setTableEntries(updatedEntries);
      handleAnimations(selectedItem.name, false, valueChange);
    } else {
      // Item does not exist, add it as a new entry
      setTableEntries([
        ...tableEntries,
        {
          ...selectedItem,
          quantity: quantityToAdd,
          value: selectedItem.value * quantityToAdd,
          id: Date.now().toString(),
        },
      ]);
      handleAnimations(selectedItem.name, false, valueChange);

      // Scroll to the bottom of the table after a short delay to ensure the new item is rendered
      setTimeout(() => {
        if (bottomOfTable.current) {
          bottomOfTable.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    }
    // Reset form
    setSearchQuery('');
    setSelectedItem(null);
    setQuantity(null);
    // Defer focus to allow state update to propagate
    setTimeout(() => {
      if (itemNameInputRef.current) {
        itemNameInputRef.current.focus();
      }
    }, 0);
  };

  const handleAnimations = (itemName: string, isDecreasing: boolean, valueChange: number) => {
    if (valueChange === 0) return;
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    addFloatingValue(valueChange, !isDecreasing);

    // Briefly set to null to ensure animation re-triggers
    setLastUpdatedItemName(null);
    setIsQuantityDecreasing(false);

    // Use requestAnimationFrame to ensure the null state is processed
    requestAnimationFrame(() => {
      setLastUpdatedItemName(itemName);
      setIsQuantityDecreasing(isDecreasing);
      // Set new timeout
      animationTimeoutRef.current = setTimeout(() => {
        setLastUpdatedItemName(null);
        setIsQuantityDecreasing(false);
        animationTimeoutRef.current = null;
      }, 750);
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddItem();
  };

  // Update item quantity in table
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    let itemName = '';
    let isDecreasing: boolean | null = null;
    let valueChange = 0;

    const updatedEntries = tableEntries.map(entry => {
      if (entry.id === id) {
        itemName = entry.name;
        const oldQuantity = entry.quantity ?? 0;
        const updatedQuantity = Math.max(1, Math.min(9999, newQuantity));
        const baseValue = entry.value / oldQuantity;
        const newValue = baseValue * updatedQuantity;

        valueChange = Math.abs(newValue - entry.value);
        isDecreasing = updatedQuantity < oldQuantity ? true : false;

        return {
          ...entry,
          quantity: updatedQuantity,
          value: newValue
        };
      }
      return entry;
    });

    setTableEntries(updatedEntries);
    if (isDecreasing !== null) {
      handleAnimations(itemName, isDecreasing, valueChange);
    }
  };

  const handleCreatedCustomItem = useCallback(() => {
    const newCustomItems = getCustomItems()
    setCustomItems(newCustomItems)

    // If we were editing an item, find the updated item by name
    // Otherwise, get the last item (newly created)
    let targetItem: ExtendedItemData
    if (itemToEdit) {
      // Find the updated item by the original item name (not the search query)
      targetItem = newCustomItems.find(item => item.name.toLowerCase() === itemToEdit.name.toLowerCase()) || newCustomItems[newCustomItems.length - 1]

      // Update table entries that use this edited item
      setTableEntries(prevEntries =>
        prevEntries.map(entry => {
          if (entry.name === itemToEdit.name) {
            return {
              ...entry,
              value: targetItem.value * (entry.quantity ?? 1),
              imageBase64: targetItem.imageBase64,
              npcNames: targetItem.npcNames
            }
          }
          return entry
        })
      )
    } else {
      // For newly created items, get the last item
      targetItem = newCustomItems[newCustomItems.length - 1]
    }

    setSelectedItem(targetItem)
    setSearchQuery(targetItem.name)
    // Use requestAnimationFrame to ensure state updates have completed
    requestAnimationFrame(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    });
  }, [itemToEdit, searchQuery])

  // Delete item from table
  const handleDeleteItem = (name: string, deleteFromCustomItems: boolean = false) => {
    const itemToDelete = tableEntries.find(entry => entry.name === name);
    if (itemToDelete) {
      handleAnimations(itemToDelete.name, true, itemToDelete.value * (itemToDelete.quantity ?? 1));
    }
    setTableEntries(tableEntries.filter(entry => entry.name !== name));
    if (deleteFromCustomItems) {
      const updatedCustomItems = deleteCustomItem(name);
      setCustomItems(updatedCustomItems);
      setSearchResultsKey(prev => prev + 1);

      // Also remove all table entries that use this deleted custom item
      setTableEntries(prevEntries =>
        prevEntries.filter(entry => entry.name !== name)
      );
    }
  };

  const getNpcColor = (npcName: string) => {
    if (npcName.startsWith("Alesar")) return 'text-green-600';
    else if (npcName.startsWith("Nah'Bob")) return 'text-blue-600';
    return '';
  }

  // Format locations for display:
  // - Insert a space before '(' when missing, e.g., "Khepresh(Royal...)" -> "Khepresh (Royal ...)"
  // - Split concatenated multi-locations like "Jakundaf DesertHero Cave" into ["Jakundaf Desert", "Hero Cave"]
  function getLocationLines(rawLocation?: string): string[] {
    if (!rawLocation) return [];
    const normalized = rawLocation
      .trim()
      .replace(/([A-Za-z])\(/g, '$1 ('); // ensure space before '('

    // Split at boundaries where a lowercase letter or ')' is immediately followed by an uppercase letter
    const parts = normalized.split(/(?<=[a-z\)])(?=[A-Z])/g).map(p => p.trim()).filter(Boolean);
    return parts.length > 0 ? parts : [normalized];
  }

  function renderLocation(rawLocation?: string) {
    const lines = getLocationLines(rawLocation);
    if (lines.length === 0) return null;
    return (
      <div>
        {lines.map((line, idx) => (
          <div key={`${line}-${idx}`}>{line}</div>
        ))}
      </div>
    );
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        !itemNameInputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const parseRaidLog = (input: string) => {
    const lines = input.split('\n').filter(line => line.trim());
    const raids: ParsedRaid[] = [];
    const unmatchedLines: { line: string, elapsedTime: number }[] = [];

    lines.forEach(line => {
      // Extract timestamp from the beginning of the line

      let elapsedTime = 0;

      // Determine explicit elapsed time if present
      const explicitTimeMatch = line.match(/\(\s*(\d+)\s+minutes?\s+ago\s*\)/i);
      // Determine timestamp at start of line if present
      const timestampMatch = line.match(/^(\d{2}):(\d{2})\s+/);

      let deltaFromTimestamp = 0;
      if (timestampMatch) {
        const hours = parseInt(timestampMatch[1]);
        const minutes = parseInt(timestampMatch[2]);

        // Calculate elapsed time based on current time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        // Calculate total minutes for both times
        const raidTimeMinutes = hours * 60 + minutes;
        const currentTimeMinutes = currentHours * 60 + currentMinutes;

        // Calculate difference (handle day wrap-around)
        deltaFromTimestamp = currentTimeMinutes - raidTimeMinutes;
        if (deltaFromTimestamp < 0) {
          deltaFromTimestamp += 24 * 60; // Add 24 hours if negative (next day)
        }
      }

      if (explicitTimeMatch) {
        const explicitMinutes = parseInt(explicitTimeMatch[1]);
        // If both explicit and timestamp exist, add them to account for old logs
        elapsedTime = explicitMinutes + deltaFromTimestamp;
      } else if (timestampMatch) {
        // Only timestamp present
        elapsedTime = deltaFromTimestamp;
      }




      // Remove timestamp and elapsed time from the line
      const cleanLine = line
        .replace(/^\d{2}:\d{2}\s+/, '') // Remove timestamp
        .replace(/\(\s*(\d+)\s+minutes?\s+ago\s*\)/i, '') // Remove elapsed time
        .trim()
        .replace(/\u00A0/g, ' ') // Normalize NBSP
        .replace(/\s+/g, ' '); // Collapse excessive whitespace

      // Find matching raid
      const normalizedCleanLine = cleanLine.toLowerCase();

      // First: detect boss messages explicitly
      const bossMatch = raidData.find(raid => {
        const messages = [
          raid.bossMessage
        ].filter(Boolean);

        return messages.some(message =>
          normalizedCleanLine.includes((message || '').replace(/\s+/g, ' ').toLowerCase())
        );
      });

      if (bossMatch) {
        // Attach boss flag to the most recent occurrence of this raid if present
        const reverseIndex = [...raids].reverse().findIndex(r => r.name === bossMatch.name);
        if (reverseIndex !== -1) {
          const originalIndex = raids.length - 1 - reverseIndex;
          if (!raids[originalIndex].hasBossMessage) {
            raids[originalIndex] = {
              ...raids[originalIndex],
              hasBossMessage: true
            };
          }
        } else {
          // If no prior occurrence exists, create a new entry with boss flag
          raids.push({
            name: bossMatch.name,
            mobs: bossMatch.mobs,
            elapsedTime: elapsedTime,
            location: bossMatch.location,
            hasBossMessage: true
          });
        }
        return; // proceed to next line
      }

      // Next: detect first messages (standard start of raid)
      const matchingRaid = raidData.find(raid => {
        const messages = [
          raid.firstMessage
        ].filter(Boolean);

        return messages.some(message =>
          normalizedCleanLine.includes((message || '').replace(/\s+/g, ' ').toLowerCase())
        );
      });

      if (matchingRaid) {
        raids.push({
          name: matchingRaid.name,
          mobs: matchingRaid.mobs,
          elapsedTime: elapsedTime,
          location: matchingRaid.location,
          hasBossMessage: false
        });
      } else {
        // Check if no second/third message match, and report errors
        const matchingRaid = raidData.find(raid => {
          const messages = [
            raid.secondMessage,
            raid.thirdMessage,
            raid.bossMessage
          ].filter(Boolean);
          return messages.some(message =>
            normalizedCleanLine.includes((message || '').replace(/\s+/g, ' ').toLowerCase())
          );
        });
        if (!matchingRaid) {
          unmatchedLines.push({ line: cleanLine, elapsedTime: elapsedTime });
        }
      }
    });

    // Preserve multiple occurrences; boss messages augment the applicable occurrence only
    setParsedRaids(raids);
    setUnmatchedLines(unmatchedLines);
  };

  useEffect(() => {
    parseRaidLog(raidLogInput);
  }, [raidLogInput]);

  // Retrigger matched/unmatched animations on every raid log input change
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [raidLogInput]);

  // Recalculate elapsed times every local minute so stale inputs keep updating
  useEffect(() => {
    if (!raidLogInput.trim()) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const recompute = () => parseRaidLog(raidLogInput);

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeoutId = setTimeout(() => {
      recompute();
      intervalId = setInterval(recompute, 60 * 1000);
    }, Math.max(0, msUntilNextMinute));

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [raidLogInput]);

  const getSortedRaids = useMemo(() => {
    if (raidViewMode === 'time') {
      return [...parsedRaids, ...unmatchedLines.map(u => ({ name: u.line, mobs: [], elapsedTime: u.elapsedTime, location: '', hasBossMessage: false }))].sort((a, b) => {
        const timeA = a.elapsedTime || 0;
        const timeB = b.elapsedTime || 0;
        return timeA - timeB;
      });
    } else {
      // Group by location
      const groupedRaids = [...parsedRaids, ...unmatchedLines.map(u => ({ name: u.line, location: "Unknown", mobs: [], elapsedTime: u.elapsedTime, hasBossMessage: false }))].reduce((acc, raid) => {
        if (!acc[raid.location]) {
          acc[raid.location] = [];
        }
        acc[raid.location].push(raid);
        return acc;
      }, {} as Record<string, ParsedRaid[]>);

      // Sort locations by most recent raid time, then sort raids within each location by time
      return Object.entries(groupedRaids)
        .map(([location, raids]) => ({
          location,
          raids: raids.sort((a, b) => {
            const timeA = a.elapsedTime || 0;
            const timeB = b.elapsedTime || 0;
            return timeA - timeB;
          })
        }))
        .sort((a, b) => {
          // Get the most recent raid time for each location (lowest elapsedTime)
          const mostRecentTimeA = Math.min(...a.raids.map(raid => raid.elapsedTime || 0));
          const mostRecentTimeB = Math.min(...b.raids.map(raid => raid.elapsedTime || 0));
          return mostRecentTimeA - mostRecentTimeB;
        });
    }
  }, [parsedRaids, raidViewMode, unmatchedLines]) as ParsedRaid[] | { location: string; raids: ParsedRaid[] }[];

  // Update the view mode handler to save to local storage
  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as 'time' | 'location';
    setRaidViewMode(newMode);
    localStorage.setItem('raidViewMode', newMode);
  };

  // Close Sell-by-NPC suggestions on outside click or ESC
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!npcFilterContainerRef.current) return;
      if (!npcFilterContainerRef.current.contains(e.target as Node)) {
        setShowNpcItemSuggestions(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNpcItemSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Build NPC -> { locations, items } map for Sell-by-NPC tab
  const npcToInfo = useMemo(() => {
    function normalizeLocationToken(token: string): string {
      const t = token.trim();
      if (!t) return '';
      // Title-case words while preserving apostrophes and spaces
      return t
        .split(/(\s|')/g)
        .map(part => /^[A-Za-z]+$/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part)
        .join('');
    }

    function extractLocationTokens(raw: string): string[] {
      // Split composite locations like "Ankrahmun/Kazordoon" or with accidental double slashes
      return raw
        .split(/[\/|]/g)
        .map(normalizeLocationToken)
        .filter(Boolean);
    }

    const map = new Map<string, { locations: Set<string>; items: ItemData[] }>();
    lootItems.forEach((item) => {
      (item.npcNames || []).forEach((rawNpc) => {
        const npcBase = (rawNpc.split('(')[0] || rawNpc).trim();
        const locationMatch = rawNpc.match(/\((.*?)\)/);
        const rawLocation = locationMatch ? locationMatch[1].trim() : '';
        if (!npcBase) return;
        if (!map.has(npcBase)) map.set(npcBase, { locations: new Set<string>(), items: [] });
        const info = map.get(npcBase)!;
        if (rawLocation) {
          extractLocationTokens(rawLocation).forEach(loc => info.locations.add(loc));
        }
        info.items.push(item);
      });
    });
    return map;
  }, []);

  const filteredNpcEntries = useMemo(() => {
    const entries = Array.from(npcToInfo.entries())
      .map(([npc, info]) => ({ npc, locations: Array.from(info.locations), items: info.items }))
      .sort((a, b) => a.npc.localeCompare(b.npc));

    // Only filter when a suggestion is selected; free-typing doesn't filter
    if (!selectedNpcItemFilter) return entries;
    if (selectedNpcItemFilter.type === 'npc') {
      return entries.filter(e => e.npc.toLowerCase() === selectedNpcItemFilter.value.toLowerCase());
    }
    // item filter - include NPCs that buy this item, but keep all items visible
    const target = selectedNpcItemFilter.value.toLowerCase();
    return entries.filter(e => e.items.some(it => it.name.toLowerCase() === target));
  }, [npcToInfo, selectedNpcItemFilter]);

  // Suggestions for filter (NPCs and Items) - shown when typing
  const npcItemSuggestions = useMemo(() => {
    const q = npcItemFilter.trim().toLowerCase();
    if (q.length < 1) return [];
    const npcNames = Array.from(npcToInfo.keys())
      .filter(npc => npc.toLowerCase().includes(q))
      .slice(0, 8)
      .map(name => ({ type: 'npc' as const, name }));
    const itemNames = lootItems
      .map(it => it.name)
      .filter((name, idx, arr) => arr.indexOf(name) === idx)
      .filter(name => name.toLowerCase().includes(q))
      .slice(0, 8)
      .map(name => ({ type: 'item' as const, name }));
    return [...npcNames, ...itemNames];
  }, [npcItemFilter, npcToInfo]);

  return (
    <div className="container">
      <div className="header-collage-mobile">
        <HeaderCollage activeTab={activeTab} />
      </div>
      <Tabs defaultValue="raids" onValueChange={handleTabChange} orientation="vertical">
        <div className="tabs-container">
          <TabsList className="flex flex-col h-[140px] w-[160px] justify-center gap-3">
            <TabsTrigger value="raids" className={`flex items-center gap-2 w-full justify-start`}>
              <div className={`flex items-center gap-2 w-full ${activeTab === 'raids' ? 'selected-tab-vertical' : ''}`}>
                <img
                  src={randomMob.imageBase64 || placeholderBase64}
                  alt={randomMob.name}
                  className="w-8 h-8 object-contain"
                  onError={handleImageError}
                />
                Raids
              </div>
            </TabsTrigger>
            <TabsTrigger value="calculator" className={`flex items-center gap-2 w-full justify-start`}>
              <div className={`flex items-center gap-2 w-full ${activeTab === 'calculator' ? 'selected-tab-vertical' : ''}`}>
                <img
                  src={randomItem.imageBase64 || placeholderBase64}
                  alt={randomItem.name}
                  className="w-6 h-6 object-contain"
                  onError={handleImageError}
                />
                Calculator
              </div>
            </TabsTrigger>
            <TabsTrigger value="sell-by-npc" className={`flex items-center gap-2 w-full justify-start`}>
              <div className={`flex items-center gap-2 w-full ${activeTab === 'sell-by-npc' ? 'selected-tab-vertical' : ''}`}>
                <img
                  src={'/images/items/crystal-coin.gif'}
                  alt="Crystal Coin"
                  className="w-6 h-6 object-contain"
                  onError={handleImageError}
                />
                Sell Loot by NPC
              </div>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="raids">
          <div className="main-content">
            <div className="form-section">
              <div className="search-form">
                <div className="form-group">
                  <label htmlFor="raid-log">Raid Log Input</label>
                  <Textarea
                    id="raid-log"
                    placeholder="Paste your raid log here..."
                    value={raidLogInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRaidLogInput(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setRaidLogInput(text);
                      } catch (err) {
                        console.error('Failed to read clipboard:', err);
                      }
                    }}
                    className="mt-2 transition-transform active:translate-y-[2px] active:scale-[0.99]"
                  >
                    Paste from Clipboard
                  </button>
                </div>
                <div className="form-group">
                  <label htmlFor="view-mode">View Mode</label>
                  <select
                    id="view-mode"
                    value={raidViewMode}
                    onChange={handleViewModeChange}
                    className="category-select"
                  >
                    <option value="time">Sort by Time (Any Location)</option>
                    <option value="location">Group by Location (Most Recent First)</option>
                  </select>
                </div>
                {unmatchedLines.length > 0 && (
                  <div key={`unmatched-${animationKey}`} className="unmatched-lines-message not-matched-message" role="status" aria-live="polite">
                    <span className="xmark-circle" aria-hidden="true" />
                    {unmatchedLines.length} raid message{unmatchedLines.length > 1 && "s"} not matched to known raids
                  </div>
                )}
                {parsedRaids.length > 0 && (
                  <div key={`matched-${animationKey}`} className="all-matched-message" role="status" aria-live="polite">
                    <span className="checkmark-circle" aria-hidden="true" />
                    {parsedRaids.length} raid{parsedRaids.length > 1 && "s"} parsed successfully from raid log
                  </div>
                )}
                {parsedRaids.some(x => x.hasBossMessage) && (
                  <div key={`boss-message-${animationKey}`} className="boss-message-message" role="status" aria-live="polite">
                    <span className="star-circle" aria-hidden="true" />
                    {parsedRaids.filter(x => x.hasBossMessage).length} raid{parsedRaids.filter(x => x.hasBossMessage).length > 1 && "s"} with a potential boss!
                  </div>
                )}
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <div className="inventory-section">
                <table className="item-table raid-table">
                  <thead>
                    <tr>
                      <th>Raid Name</th>
                      <th>Mobs</th>
                      {raidViewMode != 'location' && <th>Location</th>}
                      <th style={{ minWidth: "250px", textAlign: "center" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raidViewMode === 'time' ? (
                      // Time-based view
                      (getSortedRaids as ParsedRaid[]).map((raid: ParsedRaid, index: number) => (
                        <tr key={index} className={raid.hasBossMessage ? 'boss-glow' : ''}>
                          <td style={{ maxWidth: '200px' }}>
                            <RaidTooltip raidName={raid.mobs.length ? raid.name : "?"} />
                          </td>
                          <td colSpan={raid.mobs.length ? 1 : 2}>
                            <div className="flex flex-wrap gap-4">
                              {raid.mobs.length ? raid.mobs.map((mobName: string, mobIndex: number) => (
                                <MobCell key={mobIndex} mobName={mobName} />
                              )) : raid.name}
                            </div>
                          </td>
                          {raid.location && <td>{renderLocation(raid.location)}</td>}
                          <td>{raid.elapsedTime ? (raid.elapsedTime > 60
                            ? `${Math.floor(raid.elapsedTime / 60)} hours and ${raid.elapsedTime % 60} minutes ago`
                            : `${raid.elapsedTime} minutes ago`) : 'Now'}</td>
                        </tr>
                      ))
                    ) : (
                      // Location-based view
                      (getSortedRaids as { location: string; raids: ParsedRaid[] }[]).map(({ location, raids }) => (
                        <React.Fragment key={location}>
                          <tr className="bg-gray-100">
                            <td colSpan={4} className="font-bold text-lg py-2">
                              {renderLocation(location)}
                            </td>
                          </tr>
                          {raids.map((raid: ParsedRaid, index: number) => (
                            <tr key={`${location}-${index}`} className={raid.hasBossMessage ? 'boss-glow' : ''}>
                              <td style={{ maxWidth: '200px' }}>
                                <RaidTooltip raidName={raid.mobs.length ? raid.name : "?"} />
                              </td>
                              <td>
                                <div className="flex flex-wrap gap-4">
                                  {raid.mobs.length ? raid.mobs.map((mobName: string, mobIndex: number) => (
                                    <MobCell key={mobIndex} mobName={mobName} />
                                  )) : raid.name}
                                </div>
                              </td>
                              {raidViewMode != 'location' && <td>{raid.location}</td>}
                              <td>{raid.elapsedTime ? (raid.elapsedTime > 60
                                ? `${Math.floor(raid.elapsedTime / 60)} hours and ${raid.elapsedTime % 60} minutes ago`
                                : `${raid.elapsedTime} minutes ago`) : 'Now'}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
                {getSortedRaids.length === 0 && (
                  <BeginnerCopyingTip handleImageError={handleImageError} />
                )}

              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="calculator">
          <div className="main-content">
            <div className="form-section">
              <form className="search-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="category-select">Category</label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="category-select"
                  >
                    {Object.values(CATEGORIES).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="item-search">Item Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={itemNameInputRef}
                      id="item-search"
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={handleSearchFocus}
                      onBlur={() => setIsItemNameInputFocused(false)}
                      onKeyPress={handleSearchKeyPress}
                      onKeyUp={(e) => {
                        handleDeleteKeyUp(e);
                        handleInsertKeyUp(e);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                          setSearchResults(filteredItems);
                          setSelectedItem(null);
                        }
                      }}
                      placeholder="Search for an item..."
                      autoComplete="off"
                    />
                    {searchQuery.trim().length > 0 && isItemNameInputFocused && <span className="search-results-esc-tip">Press ESC to clear</span>}

                    {showResults && searchResults.length > 0 && (
                      <div
                        key={searchResultsKey}
                        className={`search-results ${selectedCategory === CATEGORIES.CUSTOM || searchQuery.trim() ? 'list-view' : 'grid-view'}`}
                        ref={searchResultsRef}
                      >

                        {selectedCategory === CATEGORIES.CUSTOM || searchQuery.trim() ? (
                          // Standard list layout
                          searchResults.map((item, index) => (
                            <div
                              key={index}
                              className={`search-result-item${index === 0 ? ' search-result-item--active' : ''}`}
                              onClick={() => handleSelectItem(item)}
                            >
                              {searchQuery.trim().length > 0 && isItemNameInputFocused && <span className="search-results-enter-tip">Press ENTER to accept</span>}
                              {item.category === CATEGORIES.CUSTOM && isItemNameInputFocused && index === 0 && item.name.toLowerCase().startsWith(searchQuery.trim().toLowerCase()) && (
                                <>
                                  <span className={` ${searchQuery.trim().length > 0 ? 'search-results-delete-tip' : "search-results-enter-tip"}`}>Press DEL to delete</span>
                                  <span className="search-results-insert-tip">Press INSERT to edit</span>
                                </>
                              )}
                              <div className="item-row">
                                <div className="item-image">
                                  <img
                                    src={item.imageBase64 || placeholderBase64}
                                    alt={item.name}
                                    onError={handleImageError}
                                  />
                                </div>
                                <div className="item-content">
                                  <div className="item-name">{item.name}</div>
                                  <div className="item-details">
                                    <span className="gold-text">{item.category === "New Custom" ? '?' : getDisplayValue(item.value)} gp</span>
                                    <span className={`npc-indicator ${item.category === "New Custom" ? 'new-custom' : ''}`}>
                                      {item.npcNames.length > 1
                                        ? ` ${item.npcNames.length} NPCs`
                                        : ` ${item.npcNames[0]}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Grid layout with images
                          searchResults.map((item, index) => (
                            <div
                              key={index}
                              className={`search-result-item${index === 0 ? ' search-result-item--active' : ''}`}
                              onClick={() => handleSelectItem(item)}
                            >
                              <div
                                className="item-bg"
                                style={{ backgroundImage: `url('${item.imageBase64 || placeholderBase64}')` }}
                              />
                              <div className="item-content">
                                <div className="item-value">{getDisplayValue(item.value)} gp</div>
                                <div className="item-name">{item.name}</div>
                              </div>
                            </div>
                          ))
                        )}
                        {filteredItems.length > 0 && (
                          <div className="search-results-footer">
                            Showing {searchResults.length} {searchResults.length == 1 ? "item" : "items"}{searchQuery.trim() ? " matching your search" : " in this category"}.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    placeholder="1"
                    autoComplete='off'
                    max="9999"
                    value={quantity ?? ''}
                    onChange={handleQuantityChange}
                    onKeyPress={handleQuantityKeyPress}
                    ref={quantityInputRef}
                  />
                </div>

                <button type="submit" disabled={!selectedItem}>
                  <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    Add {selectedItem ? `${quantity ?? 1}x` : ''} {selectedItem?.name ?? 'Item'} {selectedItem && <img src={selectedItem.imageBase64 || placeholderBase64} alt={selectedItem.name} className="item-image" onError={handleImageError} />}
                  </p>
                </button>
              </form>
            </div>
            <div style={{ width: '100%' }}>

              <div className="inventory-section">
                <table className="item-table">
                  <thead >
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Value</th>
                      <th>NPC(s)</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <img
                            src={entry.imageBase64 || placeholderBase64}
                            alt={entry.name}
                            className="table-item-image"
                            onError={handleImageError}
                          />
                        </td>
                        <td>{entry.name}</td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={entry.quantity}
                            onChange={(e) => handleUpdateQuantity(entry.id ?? '', parseInt(e.target.value, 10) || 1)}
                            className={`quantity-input ${lastUpdatedItemName === entry.name ? (isQuantityDecreasing ? 'highlight-update-decrease' : 'highlight-update') : ''}`}
                          />
                        </td>
                        <td style={{ minWidth: '140px', maxWidth: '140px', verticalAlign: 'middle', padding: '0px 0px 0px 10px' }}>
                          <div style={{ minHeight: "70px", display: 'flex', alignItems: 'center' }}>
                            @
                            <span className="gold-text">{(entry.value / (entry.quantity ?? 1)) > 1000 ? `${(entry.value / (entry.quantity ?? 1)) / 1000}k` : (entry.value / (entry.quantity ?? 1))} = </span>
                            <span className={`calculated-item-total ${lastUpdatedItemName === entry.name ? (isQuantityDecreasing ? 'less-gold-animation' : 'more-gold-animation') : ''}`}>&nbsp;{getDisplayValue(entry.value)}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', width: '40px' }}>
                          <div className="tooltip-container">
                            <span className="npc-count">&#9432;</span>
                            < div className="tooltip">
                              <div className="tooltip-content">
                                {entry.npcNames.map((npc) => (
                                  <span key={npc} className={`tooltip-item ${getNpcColor(npc)}`}>{npc}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteItem(entry.name ?? '')}
                            className="delete-button"
                            title="Remove entry"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tableEntries.length == 0 && (
                  <div className="no-items-message">
                    Add your loot to view it here
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="sell-by-npc">
          <div className="main-content">
            <div className="form-section">
              <div className="search-form">
                <div className="form-group">
                  <label>Filter</label>
                  <div style={{ position: 'relative' }} ref={npcFilterContainerRef}>
                    <input
                      ref={npcFilterInputRef}
                      type="text"
                      placeholder="Type to search NPCs or Items..."
                      value={npcItemFilter}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNpcItemFilter(v);
                        setShowNpcItemSuggestions(v.trim().length >= 1);
                        if (v.trim().length === 0) {
                          setSelectedNpcItemFilter(null);
                        }
                      }}
                      onFocus={() => {
                        setIsNpcFilterFocused(true);
                        setShowNpcItemSuggestions(npcItemFilter.trim().length >= 1);
                      }}
                      onBlur={() => setIsNpcFilterFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setNpcItemFilter('');
                          setSelectedNpcItemFilter(null);
                          setShowNpcItemSuggestions(false);
                          requestAnimationFrame(() => npcFilterInputRef.current?.focus());
                        }
                      }}
                      autoComplete="off"
                    />
                    {npcItemFilter.trim().length > 0 && isNpcFilterFocused && (
                      <span className="search-results-esc-tip">Press ESC to clear</span>
                    )}
                    {npcItemFilter.trim().length > 0 && (
                      <button
                        type="button"
                        className="input-clear-btn"
                        onClick={() => {
                          setNpcItemFilter('');
                          setSelectedNpcItemFilter(null);
                          setShowNpcItemSuggestions(false);
                          requestAnimationFrame(() => npcFilterInputRef.current?.focus());
                        }}
                        aria-label="Clear filter"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                    {showNpcItemSuggestions && npcItemSuggestions.length > 0 && (
                      <div
                        className="search-results grid-view overlay"
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50 }}
                      >
                        {npcItemSuggestions.map((sug, idx) => (
                          <div
                            key={`${sug.type}-${sug.name}-${idx}`}
                            className="search-result-item"
                            onClick={() => {
                              setSelectedNpcItemFilter({ type: sug.type, value: sug.name });
                              setNpcItemFilter(sug.name);
                              setShowNpcItemSuggestions(false);
                            }}
                            title={sug.type === 'npc' ? 'NPC' : 'Item'}
                          >
                            <div
                              className="item-bg"
                              style={{ backgroundImage: `url('${sug.type === 'item' ? (lootItems.find(it => it.name === sug.name)?.imageBase64 || placeholderBase64) : placeholderBase64}')` }}
                            />
                            <div className="item-content">
                              <div className="item-value">{sug.type === 'npc' ? 'NPC' : 'Item'}</div>
                              <div className="item-name">{sug.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <div className="inventory-section">
                <table className="item-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '240px', width: '240px' }}>NPC</th>
                      <th style={{ width: '100%' }}>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNpcEntries.map(({ npc, locations, items }) => (
                      <tr key={npc}>
                        <td style={{ fontWeight: 600 }}>
                          {npc}
                          {locations && locations.length > 0 && (
                            <div style={{ fontWeight: 400, fontSize: '0.85rem', color: '#6b7280' }}>
                              ({locations.join(' | ')})
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="npc-items-row">
                            {items.map((it) => {
                              const isSelectedItem = selectedNpcItemFilter?.type === 'item'
                                && it.name.toLowerCase() === selectedNpcItemFilter.value.toLowerCase();
                              return (
                                <div key={`${npc}-${it.name}`} className={`npc-item-chip${isSelectedItem ? ' npc-item-chip--highlight' : ''}`}>
                                  <img
                                    src={it.imageBase64 || placeholderBase64}
                                    alt={it.name}
                                    className="w-6 h-6 object-contain"
                                    onError={handleImageError}
                                  />
                                  <span>{it.name}</span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div style={{ position: "absolute", height: "100px" }} ref={bottomOfTable} />


      {activeTab === 'calculator' && totalValue > 0 && (
        <div className="total-footer">
          <div className="total-gold-container">
            {floatingValues.map(({ id, value, isPositive }) => (
              <div
                key={id}
                className={`floating-value ${isPositive ? 'positive' : 'negative'}`}
              >
                {isPositive ? '+' : '-'} {getDisplayValue(value)} gold
              </div>
            ))}
            <span className="total-gold-label">Total Gold:</span>
            <span className="total-gold-value">
              {getDisplayValue(totalValue)} gold
            </span>
          </div>
        </div>
      )}
      <ItemCreateModal
        open={isCreateModalOpen}
        name={itemToEdit ? itemToEdit.name : searchQuery.trim().charAt(0).toUpperCase() + searchQuery.trim().slice(1)}
        onClose={() => {
          setIsCreateModalOpen(false)
          setItemToEdit(null)
        }}
        onCreated={handleCreatedCustomItem}
        isEditMode={!!itemToEdit}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}

export default App;