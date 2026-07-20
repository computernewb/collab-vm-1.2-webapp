import { Language } from './';

const enusLanguage: Language = {
	languageName: 'English (US)',
	translatedLanguageName: 'English (US)',
	flag: '🇺🇸',
	author: 'Computernewb',

	stringKeys: {
		kGeneric_CollabVM: 'CollabVM',
		kGeneric_Yes: 'Yes',
		kGeneric_No: 'No',
		kGeneric_Ok: 'OK',
		kGeneric_Cancel: 'Cancel',
		kGeneric_Send: 'Send',
		kGeneric_Understood: 'Understood',
		kGeneric_Username: 'Username',
		kGeneric_Password: 'Password',
		kGeneric_Login: 'Log in',
		kGeneric_Register: 'Register',
		kGeneric_EMail: 'E-Mail',
		kGeneric_DateOfBirth: 'Date of Birth',
		kGeneric_VerificationCode: 'Verification Code',
		kGeneric_Verify: 'Verify',
		kGeneric_Update: 'Update',
		kGeneric_Logout: 'Log out',

		kWelcomeModal_Header: 'Welcome to CollabVM',
		kWelcomeModal_Lead: 'CollabVM allows you to to take turns controlling online virtual machines with complete strangers!',

		kSiteButtons_Home: 'Home',
		kSiteButtons_FAQ: 'FAQ',
		kSiteButtons_Rules: 'Rules',
		kSiteButtons_DarkMode: 'Dark Mode',
		kSiteButtons_LightMode: 'Light Mode',
		kSiteButtons_Languages: 'Languages',

		kVM_UsersOnlineText: 'Users Online:',

		kVM_TurnTimeTimer: 'Turn expires in {0} seconds.',
		kVM_TurnYouHave: 'You have the turn.',
		kVM_TurnsPaused: 'Turns have been paused.',
		kVM_WaitingTurnTimer: 'Waiting for turn in {0} seconds.',

		kVM_VoteCooldownTimer: 'Please wait {0} seconds before starting another vote.',
		kVM_VoteError_existingVote: 'A vote is already in progress.',
		kVM_VoteTitle: 'Do you want to {0}?',
		kVM_VoteTimer: 'Vote ends in {0} seconds',
		kVM_VoteStarted: '{0} has started a vote to {1}.',
		kVM_VoteSuccess: 'The vote to {0} has won.',
		kVM_VoteFail: 'The vote to {0} has lost.',
		kVM_UserVotedYes: '{0} has voted yes.',
		kVM_UserVotedNo: '{0} has voted no.',
		kVM_VoteMarker_UserVotedYes: 'Voted yes',
		kVM_VoteMarker_UserVotedNo: 'Voted no',
		kVM_VoteType_VoteReset: 'reset the VM',
		kVM_VoteType_VoteReboot: 'reboot the VM',
		kVM_VoteType_VoteIaosInsertMedia: 'insert {0} into the {1}',
		kVM_VoteType_VoteIaosEjectMedia: 'eject the {0}',

		kVMButtons_TakeTurn: 'Take Turn',
		kVMButtons_EndTurn: 'End Turn',
		kVMButtons_ChangeUsername: 'Change Username',
		kVMButtons_Keyboard: 'Keyboard',
		KVMButtons_CtrlAltDel: 'Ctrl+Alt+Del',

		kVMButtons_Vote: 'Vote...',
		kVMButtons_Screenshot: 'Screenshot',

		kQEMUMonitor: 'QEMU Monitor',
		kAdminVMButtons_PassVote: 'Pass Vote',
		kAdminVMButtons_CancelVote: 'Cancel Vote',

		kAdminVMButtons_Restore: 'Restore',
		kAdminVMButtons_Reboot: 'Reboot',
		kAdminVMButtons_ClearTurnQueue: 'Clear Turn Queue',
		kAdminVMButtons_BypassTurn: 'Bypass Turn',
		kAdminVMButtons_PauseTurns: 'Pause Turns',
		kAdminVMButtons_UnpauseTurns: 'Unpause Turns',
		kAdminVMButtons_GhostTurnOn: 'Ghost Turn (On)',
		kAdminVMButtons_GhostTurnOff: 'Ghost Turn (Off)',

		kAdminVMButtons_Ban: 'Ban',
		kAdminVMButtons_Kick: 'Kick',
		kAdminVMButtons_TempMute: 'Temporary Mute',
		kAdminVMButtons_IndefMute: 'Indefinite Mute',
		kAdminVMButtons_Unmute: 'Unmute',
		kAdminVMButtons_GetIP: 'Get IP',

		kVMPrompts_AdminChangeUsernamePrompt: 'Enter new username for {0}:',
		kVMPrompts_AdminRestoreVMPrompt: 'Are you sure you want to restore the VM?',
		kVMPrompts_EnterNewUsernamePrompt: 'Enter a new username, or leave the field blank to be assigned a guest username',

		kError_UnexpectedDisconnection: 'You have been disconnected from the server.',
		kError_UsernameTaken: 'That username is already taken',
		kError_UsernameInvalid: 'Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters.',
		kError_UsernameBlacklisted: 'That username has been blacklisted.',
		kError_IncorrectPassword: 'Incorrect password.',

		kAccountModal_Verify: 'Verify E-Mail',
		kAccountModal_AccountSettings: 'Account Settings',
		kAccountModal_ResetPassword: 'Reset Password',

		kAccountModal_NewPassword: 'New Password',
		kAccountModal_ConfirmNewPassword: 'Confirm New Password',
		kAccountModal_CurrentPassword: 'Current Password',
		kAccountModal_ConfirmPassword: 'Confirm Password',
		kAccountModal_HideFlag: 'Hide my Country Flag',

		kMissingCaptcha: 'Please fill out the captcha.',
		kPasswordsMustMatch: 'Passwords must match.',
		kAccountModal_VerifyText: 'We sent an E-Mail to {0}. To verify your account, please enter the 8-digit code from the E-Mail below.',
		kAccountModal_VerifyPasswordResetText: 'We sent an E-Mail to {0}. To reset your password, please enter the 8-digit code from the E-Mail below.',
		kAccountModal_PasswordResetSuccess: 'Your password has been changed successfully. You can now log in with your new password.',

		kNotLoggedIn: 'Not Logged in',

		kIaosMediaKind_iso: 'Disc Images',
		kIaosMediaKind_flp: 'Floppy Images',
		kIaosDriveMediaKind_iso: 'CD drive',
		kIaosDriveMediaKind_flp: 'floppy drive',
		kIaosMediaChanged: '{0} inserted {1} into the {2}.',
		kIaosMediaEjected: '{0} ejected the {1}.',
		kIaosChangeMediaHeader: 'Change Media',
		kIaosInsert: 'Load..',
		kIaosEject: 'Eject',
		kIaosTableHeader_Build: 'Build',
		kIaosTableHeader_Architecture: 'Arch',
		kIaosTableHeader_Year: 'Year'
	}
};

export default enusLanguage;
