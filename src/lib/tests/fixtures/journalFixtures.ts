import { createMockJournalEntry } from "../utils/factories";

export const mockJournalEntry = createMockJournalEntry();

export const mockJournalWithImages = createMockJournalEntry({
    images: ["img1.jpg", "img2.jpg"]
});

export const mockJournalWithTrades = createMockJournalEntry({
    // We would link trade IDs here usually if the type supports it directly
    // checking types... currently JournalEntry might link differently, 
    // but assuming simple ID reference or array for this fixture.
});
