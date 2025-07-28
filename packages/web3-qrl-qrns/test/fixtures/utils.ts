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
	['qrl', '0x5ca200831516f7386952dbee215dfe7e4920ece6d31d89501d03e9239082ae7a'],
	['foo.qrl', '0xa5bb084f89105bd16dff5eef797279b0c91d93529934875c65e3f2948b8b5be9'],
	['FOO.qrl', '0xa5bb084f89105bd16dff5eef797279b0c91d93529934875c65e3f2948b8b5be9'],
];

export const normalizeValidData: [string, string][] = [
	['Öbb.at', 'öbb.at'],
	['Ⓜ', 'm'],
	['foo.qrl', 'foo.qrl'],
	['Foo.qrl', 'foo.qrl'],
	['🦚.qrl', '🦚.qrl'],
];
