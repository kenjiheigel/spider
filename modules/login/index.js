function Login() {}

Login.prototype = {
	constructor: Login,

	signIn: function(user, password) {
		casper.fill('.sign-in-form', {
			'_58_login': user,
			'_58_password': password
		}, true);

		casper.waitForSelector(
			'.user-avatar-link .user-full-name',
			function onSuccess() {
				casper.test.pass('User logged successfully');
			},
			function onTimeout() {
				casper.test.fail("Not logged successfully");
			}
		);
	},

	signOut: function() {
		if(casper.exists('.sign-out a')) {
			casper.click('.sign-out a');

			casper.waitUntilVisible('.sign-in a',
				function onSuccess() {
					casper.echo('Page URL is: ' + casper.getCurrentUrl());

					casper.test.assertUrlMatch('\/web\/guest\/home', 'User logged out successfully');
				},
				function onFail() {
					casper.test.fail('User not logged out successfully');
				}
			);
		}
	}
};

module.exports.Login = Login;