import { Language } from "./i18n.js";

const fallbackLanguage : Language = {
	"languageName": "English (US)",
	"translatedLanguageName": "English (US)",
	"flag": "🇺🇸",
	"author": "Computernewb",

	"stringKeys": {
		"kGeneric_CollabVM": "CollabVM",
		"kGeneric_Yes": "Yes",
		"kGeneric_No": "No",
		"kGeneric_Ok": "OK",
		"kGeneric_Cancel": "Cancel",
		"kGeneric_Send": "Send",
		"kGeneric_Understood": "Understood",
		"kGeneric_Username": "Username",
		"kGeneric_Password": "Password",
		"kGeneric_Login": "Log in",
		"kGeneric_Register": "Register",
		"kGeneric_EMail": "E-Mail",
		"kGeneric_DateOfBirth": "Date of Birth",
		"kGeneric_VerificationCode": "Verification Code",
		"kGeneric_Verify": "Verify",
		"kGeneric_Update": "Update",
		"kGeneric_Logout": "Log out",
		
		"kWelcomeModal_Header": "Welcome to CollabVM",
		"kWelcomeModal_Body": "<p>Before continuing, please familiarize yourself with our rules:</p> <h3>R1. Don't break the law.</h3> Do not use CollabVM or CollabVM's network to violate United States federal law, New York state law, or international law. If CollabVM becomes aware a crime has been committed through its service, you will be immediately banned, and your activities may be reported to the authorities if necessary.<br><br>CollabVM is required by law to notify law enforcement agencies if it becomes aware of the presence of child pornography on, or being transmitted through its network.<br><br>COPPA is also enforced, please do not use CollabVM if you are under the age of 13 years old. <h3>R2. No running DoS/DDoS tools.</h3> Do not use CollabVM to DoS/DDoS an indivdiual, business, company, or anyone else. <h3>R3. No spam distribution.</h3> Do not spam any emails using this service or push spam in general. <h3>R4. Do not abuse any exploits.</h3> Do not abuse any exploits, additionally if you see someone abusing exploits or you need to report one, please contact me at: computernewbab@gmail.com <h3>R5. Don't impersonate other users.</h3> Do not impersonate other members of CollabVM. If caught, you'll be temporarily disconnected, and banned if necessary. <h3>R6. One vote per person.</h3> Do not use any methods or tools to bypass the vote restriction. Only one vote per person is allowed, no matter what. Anybody who is caught doing this will be banned. <h3>R7. No Remote Administration Tools.</h3> Do not use any remote administration tools (ex: DarkComet, NanoCore, Anydesk, TeamViewer, Orcus, etc.) <h3>R8. No bypassing CollabNet.</h3> Do not attempt to bypass the blocking provided by CollabNet, especially if it is being used to break Rule 1, Rule 2, or Rule 7 (or run stupid over-used things). <h3>R9. No performing destructive actions constantly.</h3> Any user may not destroy the VM (rendering it unusable constantly), install/reinstall the operating system (except on VM7 or VM8), or run bots that do such. This includes bots that spam massive amounts of keyboard/mouse input (\"kitting\"). <h3>R10. No Cryptomining</h3> Attempting to mine cryptocurrency on the VMs will result in a kick, and then a permanent ban if you keep attempting. Besides, it's not like you're gonna make any money off it. <h3>NSFW Warning</h3> Please note that NSFW content is allowed on our anarchy VM (VM0b0t), and is viewed regularly. In addition, while we give a good effort to keep NSFW off the main VMs, people will occasionally slip it through.",

		"kSiteButtons_Home": "Home",
		"kSiteButtons_FAQ": "FAQ",
		"kSiteButtons_Rules": "Rules",
		"kSiteButtons_DarkMode": "Dark Mode",
		"kSiteButtons_LightMode": "Light Mode",

		"kVM_UsersOnlineText": "Users Online:",

		"kVM_TurnTimeTimer": "Turn expires in {0} seconds.",
		"kVM_WaitingTurnTimer": "Waiting for turn in {0} seconds.",
		"kVM_VoteCooldownTimer": "Please wait {0} seconds before starting another vote.",

		"kVM_VoteForResetTitle": "Do you want to reset the VM?",
		"kVM_VoteForResetTimer": "Vote ends in {0} seconds",

		"kVMButtons_TakeTurn": "Take Turn",
		"kVMButtons_EndTurn": "End Turn",
		"kVMButtons_ChangeUsername": "Change Username",
		"kVMButtons_Keyboard": "Keyboard",
		"KVMButtons_CtrlAltDel": "Ctrl+Alt+Del",

		"kVMButtons_VoteForReset": "Vote For Reset",
		"kVMButtons_Screenshot": "Screenshot",

		"kQEMUMonitor": "QEMU Monitor",
		"kAdminVMButtons_PassVote": "Pass Vote",
		"kAdminVMButtons_CancelVote": "Cancel Vote",

		"kAdminVMButtons_Restore": "Restore",
		"kAdminVMButtons_Reboot": "Reboot",
		"kAdminVMButtons_ClearTurnQueue": "Clear Turn Queue",
		"kAdminVMButtons_BypassTurn": "Bypass Turn",
		"kAdminVMButtons_IndefiniteTurn": "Indefinite Turn",

		"kAdminVMButtons_Ban": "Ban",
		"kAdminVMButtons_Kick": "Kick",
		"kAdminVMButtons_TempMute": "Temporary Mute",
		"kAdminVMButtons_IndefMute": "Indefinite Mute",
		"kAdminVMButtons_Unmute": "Unmute",
		"kAdminVMButtons_GetIP": "Get IP",

		"kVMPrompts_AdminChangeUsernamePrompt": "Enter new username for {0}:",
		"kVMPrompts_AdminRestoreVMPrompt": "Are you sure you want to restore the VM?",
		"kVMPrompts_EnterNewUsernamePrompt": "Enter a new username, or leave the field blank to be assigned a guest username",

		"kError_UnexpectedDisconnection": "You have been disconnected from the server.",
		"kError_UsernameTaken": "That username is already taken",
		"kError_UsernameInvalid": "Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters.",
		"kError_UsernameBlacklisted": "That username has been blacklisted.",
		"kError_IncorrectPassword": "Incorrect password.",

		"kAccountModal_Verify": "Verify E-Mail",
		"kAccountModal_AccountSettings": "Account Settings",
		"kAccountModal_ResetPassword": "Reset Password",

		"kAccountModal_NewPassword": "New Password",
		"kAccountModal_ConfirmNewPassword": "Confirm New Password",
		"kAccountModal_CurrentPassword": "Current Password",
		"kAccountModal_ConfirmPassword": "Confirm Password",

		"kMissingCaptcha": "Please fill out the captcha.",
		"kPasswordsMustMatch": "Passwords must match.",
		"kAccountModal_VerifyText": "We sent an E-Mail to {0}. To verify your account, please enter the 8-digit code from the E-Mail below.",
		"kAccountModal_VerifyPasswordResetText": "We sent an E-Mail to {0}. To reset your password, please enter the 8-digit code from the E-Mail below.",
		"kAccountModal_PasswordResetSuccess": "Your password has been changed successfully. You can now log in with your new password.",

		"kNotLoggedIn": "Not Logged in"
	}
}

export default fallbackLanguage;