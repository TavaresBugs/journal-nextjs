import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ASSETS = {
  EURUSD: { multiplier: 100000, price: 1.08, spread: 0.0001 },
  GBPUSD: { multiplier: 100000, price: 1.26, spread: 0.0002 },
  USDJPY: { multiplier: 100000, price: 150.0, spread: 0.01 },
  XAUUSD: { multiplier: 100, price: 2030.0, spread: 0.2 },
  US30: { multiplier: 1, price: 38000.0, spread: 2.0 },
  NQ: { multiplier: 1, price: 17500.0, spread: 1.25 },
};

const STRATEGIES = ["Pullback", "Breakout", "Reversal", "Trend Following"];
const SETUPS = ["Pivô de Alta", "Pivô de Baixa", "FVG", "Order Block", "Breaker"];

async function seed() {
  console.log("🌱 Starting seed...");

  const users = [];

  // 1. Create 5 Users
  for (let i = 0; i < 5; i++) {
    const email = faker.internet.email();
    const password = "password123"; // Default password for testing

    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: faker.person.fullName(),
      },
    });

    if (userError) {
      console.error(`Error creating user ${email}:`, userError.message);
      continue;
    }

    if (user.user) {
      users.push(user.user);
      console.log(`User created: ${email}`);

      // 2. Create Account for User
      // Note: Triggers might handle this in some setups, but the schema 000_init_schema.sql
      // does not show an auto-create trigger for accounts on user creation.

      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: user.user.id,
          name: "Main Account",
          initial_balance: 100000,
          current_balance: 100000, // Will be updated by trades potentially, but starting flat
          leverage: "1:100",
          currency: "USD",
        })
        .select()
        .single();

      if (accountError) {
        console.error(`Error creating account for ${email}:`, accountError.message);
        continue;
      }

      console.log(`Account created for ${email}`);

      // 3. Create Settings (Optional but good for completeness)
      const { error: settingsError } = await supabase.from("settings").insert({
        user_id: user.user.id,
        account_id: account.id,
      });

      if (settingsError) {
        console.warn(
          `Warning: Could not create settings for ${email} (might already exist via trigger?):`,
          settingsError.message
        );
      }

      // 4. Create 50 Trades per User
      const trades = [];
      let currentBalance = 100000;

      // Generate dates in the last 6 months, sorted
      const entries = [];
      for (let t = 0; t < 50; t++) {
        entries.push(faker.date.recent({ days: 180 }));
      }
      entries.sort((a, b) => a.getTime() - b.getTime());

      for (let t = 0; t < 50; t++) {
        const symbolKey = faker.helpers.objectKey(ASSETS);
        const assetInfo = ASSETS[symbolKey as keyof typeof ASSETS];
        const type = faker.helpers.arrayElement(["Long", "Short"]);
        const lot = faker.number.float({ min: 0.1, max: 5.0, fractionDigits: 2 });

        // Price simulation
        const entryPrice = assetInfo.price * (1 + faker.number.float({ min: -0.05, max: 0.05 }));
        const isWin = faker.datatype.boolean(); // Random win/loss

        // Calculate PnL and Exit Price
        // PnL = (Exit - Entry) * Lot * Multiplier (for Long)
        // For testing, let's define PnL first then back out Exit Price

        let pnl;
        if (isWin) {
          pnl = faker.number.float({ min: 50, max: 2000, fractionDigits: 2 });
        } else {
          pnl = faker.number.float({ min: -1000, max: -50, fractionDigits: 2 });
        }

        // Adjust PnL slightly for realistic "breakeven" occasionally
        if (faker.number.int({ min: 1, max: 20 }) === 1) {
          pnl = 0;
          // outcome breakeven
        }

        let exitPrice;
        if (type === "Long") {
          // PnL = (Exit - Entry) * Lot * Multiplier
          // Exit = (PnL / (Lot * Multiplier)) + Entry
          exitPrice = pnl / (lot * assetInfo.multiplier) + entryPrice;
        } else {
          // PnL = (Entry - Exit) * Lot * Multiplier
          // Exit = Entry - (PnL / (Lot * Multiplier))
          exitPrice = entryPrice - pnl / (lot * assetInfo.multiplier);
        }

        let outcome = "breakeven";
        if (pnl > 0) outcome = "win";
        if (pnl < 0) outcome = "loss";

        currentBalance += pnl;

        const entryDate = entries[t];
        const exitDate = new Date(
          entryDate.getTime() + faker.number.int({ min: 1000 * 60 * 5, max: 1000 * 60 * 60 * 24 })
        ); // 5 mins to 1 day duration

        trades.push({
          user_id: user.user.id,
          account_id: account.id,
          symbol: symbolKey,
          type,
          entry_price: parseFloat(entryPrice.toFixed(5)),
          exit_price: parseFloat(exitPrice.toFixed(5)),
          stop_loss: parseFloat((entryPrice * (type === "Long" ? 0.99 : 1.01)).toFixed(5)), // Dummy SL
          take_profit: parseFloat((entryPrice * (type === "Long" ? 1.02 : 0.98)).toFixed(5)), // Dummy TP
          lot,
          entry_date: entryDate.toISOString().split("T")[0], // YYYY-MM-DD
          entry_time: entryDate.toTimeString().split(" ")[0], // HH:MM:SS
          exit_date: exitDate.toISOString().split("T")[0],
          exit_time: exitDate.toTimeString().split(" ")[0],
          pnl: pnl,
          outcome,
          strategy: faker.helpers.arrayElement(STRATEGIES),
          setup: faker.helpers.arrayElement(SETUPS),
          notes: faker.lorem.sentence(),
          tf_analise: "H1",
          tf_entrada: "M5",
        });
      }

      const { error: tradesError } = await supabase.from("trades").insert(trades);

      if (tradesError) {
        console.error(`Error inserting trades for ${email}:`, tradesError.message);
      } else {
        console.log(`Inserted 50 trades for ${email}. Final Balance: ${currentBalance.toFixed(2)}`);

        // Update account balance
        await supabase
          .from("accounts")
          .update({ current_balance: currentBalance })
          .eq("id", account.id);
      }
    }
  }

  console.log("✅ Seed completed!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
