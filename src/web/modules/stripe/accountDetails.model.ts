import {
  Length,
  IsString,
  IsNotEmpty,
  Matches
} from 'class-validator'

import Validated from '../common/validated'

class AccountDetails extends Validated {
  @Matches(/^[^<>'"\\]+$/, { message: 'Statement descriptor cannot contain the following < > \\ \' "' })
  @Length(5, 22, { message: 'Statement descriptor must be between 5 and 22 characters' })
  @IsString()
  @IsNotEmpty({ message: 'Please enter a statement descriptor' })
  public statementDescriptor: string;

  public constructor(formValues: { [key: string]: string }) {
    super()
    this.statementDescriptor = formValues.statementDescriptor
    this.validate()
  }
}

export default AccountDetails
