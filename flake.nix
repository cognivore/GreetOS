{
    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs";
    };

    outputs = {self, fenix, nixpkgs}:
        let pkgs = nixpkgs.legacyPackages.x86_64-linux;
            npkgs = pkgs.nodePackages;

        in {
            defaultPackage.x86_64-linux = pkgs.hello;

            devShell.x86_64-linux =
                pkgs.mkShell {
                    buildInputs = [
                        pkgs.nodejs_22
                        pkgs.pnpm
                        npkgs.typescript
                        npkgs.node-gyp
                        npkgs.serve

                        pkgs.git
                        pkgs.pwgen
                        pkgs.coreutils-full
                        
                        pkgs.httpie
                        pkgs.jq
                        pkgs.yq
                        pkgs.dig
                        pkgs.shellcheck

                        pkgs.zip
                        pkgs.unzip
                        pkgs.ripgrep
                        pkgs.expect
                    ];
                };
        };
}
