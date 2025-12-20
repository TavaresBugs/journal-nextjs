import { createMockJournalEntry } from "../utils/factories";

export const mockJournalEntry = createMockJournalEntry();

export const mockJournalWithImages = createMockJournalEntry({
  images: [
    {
      id: "img-1",
      userId: "user-123",
      journalEntryId: "journal-1",
      url: "img1.jpg",
      path: "path/img1.jpg",
      timeframe: "H1",
      displayOrder: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "img-2",
      userId: "user-123",
      journalEntryId: "journal-1",
      url: "img2.jpg",
      path: "path/img2.jpg",
      timeframe: "M15",
      displayOrder: 1,
      createdAt: new Date().toISOString(),
    },
  ],
});

export const mockJournalWithTrades = createMockJournalEntry({
  // We would link trade IDs here usually if the type supports it directly
  // checking types... currently JournalEntry might link differently,
  // but assuming simple ID reference or array for this fixture.
});
