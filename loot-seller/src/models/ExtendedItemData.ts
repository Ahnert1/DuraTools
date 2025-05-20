import { ItemData } from "../data/itemDataMultiNpc";

// Define the extended ItemData interface with additional fields we'll use
export interface ExtendedItemData extends ItemData {
    quantity?: number;
    id?: string;
}