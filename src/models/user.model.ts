import { getModelForClass, prop, pre, ModelOptions, Severity, index } from '@typegoose/typegoose'
import bcrypt from 'bcryptjs'
import config from 'config'

// eslint-disable-next-line no-use-before-define, func-names
@pre<User>('save', async function (next): Promise<void> {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, config.get<number>('costFactor'))
  this.passwordConfirm = undefined
  return next()
})
@ModelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index({ email: 1 })
export class User {
  readonly id: string

  @prop({ required: true })
  userName: string

  @prop({ required: true, select: false })
  password: string

  @prop({ required: true })
  passwordConfirm: string | undefined

  @prop({ default: true, select: false })
  verified: boolean

  static comparePasswords = async (
    hashedPassword: string,
    candidatePassword: string
  ): Promise<boolean> => {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword)
    } catch (error) {
      console.error(error)
      return false
    }
  }
}

const UserModel = getModelForClass<typeof User>(User)
export default UserModel
