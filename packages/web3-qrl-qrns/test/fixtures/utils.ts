/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/

export const namehashValidData: [string, string][] = [
	['', '0x0000000000000000000000000000000000000000000000000000000000000000'],
	['qrl', '0x2e567ec4acbf65494d1ba700c19be055d50a2c97fe0ab1bc3e1180be43b3656a'],
	['foo.qrl', '0x53eee0632697b8eca7afe53ea586de69711eee0c93db01d74119828543ee99fe'],
	['FOO.qrl', '0x53eee0632697b8eca7afe53ea586de69711eee0c93db01d74119828543ee99fe'],
];

export const normalizeValidData: [string, string][] = [
	['Öbb.at', 'öbb.at'],
	['Ⓜ', 'm'],
	['foo.qrl', 'foo.qrl'],
	['Foo.qrl', 'foo.qrl'],
	['🦚.qrl', '🦚.qrl'],
];
