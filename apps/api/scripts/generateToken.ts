import { program } from 'commander'
import { randomUUID } from 'crypto'
import supabase, { SupabaseError } from 'spackle-supabase'

program.option('<note>', 'The note to add', '')
program.parse()

const [notes] = program.args

async function main(notes: string) {
  const token = randomUUID().slice(0, 8)
  const { error } = await supabase.from('invites').insert({
    token,
    notes,
  })

  if (error) {
    throw new SupabaseError(error)
  }

  console.log('Created token: ', token)
}

main(notes)
