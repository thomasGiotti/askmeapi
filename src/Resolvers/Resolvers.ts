import people from '../dataset'

const Resolvers = {
  Query: {
    getAllPeople: () => people,
    getPerson: (_: any, args: any) => {
      console.log(args)
      return people.find(person => person.id === args.id)
    },
  },
}

export default Resolvers
