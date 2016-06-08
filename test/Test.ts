///<reference path="TestStorage.ts"/>
///<reference path="TestTextProcessor.ts" />
///<reference path="TestIndex.ts" />
///<reference path="TestContentTransformer.ts"/>
///<reference path="TestDigest.ts"/>
///<reference path="TestTokenizer.ts"/>
///<reference path="TestRank.ts"/>

TestIndexNamespace.runIndexTest();
TestTextProcessorNamespace.runTextProcessorTest();
TestStorageNamespace.runStorageTest();
TestContentTransformerNamespace.runContentTransformerTest();
TestDigestNamespace.testDigest();
TestTokenizerNamespace.runTokenizorTest();
TestRankNamespace.runRankTest();
