import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({Key? key}) : super(key: key);

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}
enum UserType { Buyer, Seller }

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  TextEditingController emailController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  UserType? _type = UserType.Buyer;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Register'),
      ),
      body: Form(
        key: _formKey,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
                child: TextFormField(
                  controller: emailController,
                  decoration: const InputDecoration(
                      border: OutlineInputBorder(), labelText: "Email"),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    return null;
                  },
                ),
              ),
              Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
                child: TextFormField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                      border: OutlineInputBorder(), labelText: "Password"),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
              ),
              Padding(
                  padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
                child: Column(
                  children: <Widget>[
                    ListTile(
                      title: const Text('Buyer'),
                      leading: Radio<UserType>(
                        value: UserType.Buyer,
                        groupValue: _type,
                        onChanged: (UserType? value) {
                          setState(() {
                            _type = value;
                          });
                        },
                      ),
                    ),
                    ListTile(
                      title: const Text('Seller'),
                      leading: Radio<UserType>(
                        value: UserType.Seller,
                        groupValue: _type,
                        onChanged: (UserType? value) {
                          setState(() {
                            _type = value;
                          });
                        },
                      ),
                    ),
                  ],
                  ),
              )
            ],
          ),
        )
      ),
    );
  }
}
