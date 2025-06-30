import { DatabaseTester } from './database-test'

async function main() {
  const tester = new DatabaseTester()
  const success = await tester.runAllTests()
  
  if (!success) {
    process.exit(1)
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as runDatabaseTests } 